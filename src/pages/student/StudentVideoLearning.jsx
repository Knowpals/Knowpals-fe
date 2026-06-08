import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { message, Checkbox } from 'antd';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';
import {
  QUESTION_TYPE, QUESTION_TYPE_META, OPTION_LETTERS,
  normalizeQuestionType, formatOptions, isAnswerCorrect, buildAnswerPayload,
  normalizeQuestionData,
} from '../../constants/questionTypes';

injectStyles('student-video', `
  /* ========== 容器 ========== */
  .video-play-container-v2 {
    width: 100%; min-height: 100vh; background: #0f0f0f;
    display: flex; flex-direction: column;
  }

  /* ========== 导航栏 ========== */
  .video-nav-bar-v2 {
    display: flex; align-items: center; height: 52px;
    background: #1a1a1a; color: #fff; padding: 0 16px;
    flex-shrink: 0; z-index: 200;
  }
  .video-nav-back-v2 {
    width: 36px; height: 36px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; font-size: 22px;
    border-radius: 8px; transition: background 0.2s;
  }
  .video-nav-back-v2:hover { background: rgba(255,255,255,0.1); }
  .video-nav-title-v2 {
    font-size: 16px; font-weight: 500; flex: 1; text-align: center;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 16px;
  }
  .video-nav-right-v2 { width: 36px; }

  /* ========== 主内容区 ========== */
  .video-main-area-v2 {
    flex: 1; display: flex; flex-direction: column;
    max-width: 1280px; width: 100%; margin: 0 auto; padding: 0;
  }

  /* ========== 视频播放区 ========== */
  .video-section-v2 {
    position: relative; width: 100%; background: #000;
    max-height: 55vh; min-height: 240px;
  }
  /* 在宽屏上用 16:9，但限制高度；窄屏自适应 */
  @media (min-width: 769px) {
    .video-section-v2 { aspect-ratio: 16 / 9; max-height: 60vh; }
  }
  @media (max-width: 768px) {
    .video-section-v2 { aspect-ratio: auto; height: 240px; }
  }
  .video-player-v2 {
    width: 100%; height: 100%; display: block; object-fit: contain; background: #000;
  }
  .video-placeholder-v2 {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: #000; display: flex; flex-direction: column;
    align-items: center; justify-content: center; z-index: 1;
  }
  .video-spinner-v2 {
    width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2);
    border-top-color: #7c3aed; border-radius: 50%;
    animation: spin-v2 0.8s linear infinite; margin-bottom: 12px;
  }
  @keyframes spin-v2 { to { transform: rotate(360deg); } }
  .video-loading-text-v2 { color: #aaa; font-size: 14px; }
  .video-cover-v2 {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); display: flex;
    align-items: center; justify-content: center; z-index: 5;
    cursor: pointer;
  }
  .play-btn-large-v2 {
    width: 72px; height: 72px; background: rgba(255,255,255,0.92);
    border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 28px; color: #1a1a1a;
    padding-left: 6px; cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }
  .play-btn-large-v2:hover { transform: scale(1.06); box-shadow: 0 6px 32px rgba(0,0,0,0.5); }

  /* ========== 控制栏 ========== */
  .progress-control-bar-v2 {
    background: #1a1a1a; padding: 12px 20px 14px;
    border-top: 1px solid #2a2a2a; flex-shrink: 0;
  }
  .progress-row-v2 {
    display: flex; align-items: center; margin-bottom: 12px;
  }
  .time-info-v2 {
    font-size: 12px; color: #888; min-width: 42px; text-align: center;
    font-variant-numeric: tabular-nums; font-family: 'SF Mono', 'Consolas', monospace;
  }
  .progress-track-wrapper-v2 {
    flex: 1; position: relative; height: 5px; background: #3a3a3a;
    border-radius: 3px; margin: 0 12px; cursor: pointer;
    transition: height 0.15s;
  }
  .progress-track-wrapper-v2:hover { height: 7px; }
  .progress-fill-v2 {
    position: absolute; top: 0; left: 0; height: 100%;
    background: linear-gradient(90deg, #7c3aed, #a78bfa); border-radius: 3px;
    transition: width 0.1s linear;
  }
  .progress-thumb-v2 {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 14px; height: 14px; background: #fff;
    border: 2px solid #7c3aed; border-radius: 50%;
    opacity: 0; transition: opacity 0.15s;
  }
  .progress-track-wrapper-v2:hover .progress-thumb-v2 { opacity: 1; }
  .progress-node-v2 {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;
    border: 2px solid #1a1a1a; box-shadow: 0 0 8px rgba(245,158,11,0.6);
    cursor: pointer; z-index: 10; transition: transform 0.15s;
  }
  .progress-node-v2:hover { transform: translate(-50%, -50%) scale(1.3); }
  .progress-node-v2.triggered { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.6); }
  .progress-node-v2.answered { background: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.6); }
  .control-row-v2 {
    display: flex; align-items: center; justify-content: space-between;
  }
  .control-left-v2, .control-right-v2 { display: flex; align-items: center; gap: 12px; }
  .control-btn-v2 {
    width: 36px; height: 36px; background: #2a2a2a; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #ccc; font-size: 13px; cursor: pointer;
    transition: background 0.2s, color 0.2s; border: none;
  }
  .control-btn-v2:hover { background: #3a3a3a; color: #fff; }
  .play-pause-btn-v2 {
    width: 44px; height: 44px;
    background: #7c3aed; color: #fff; font-size: 18px;
  }
  .play-pause-btn-v2:hover { background: #6d28d9; }
  .interaction-toggle-v2.active { background: #7c3aed; color: #fff; }
  .ai-btn-v2 {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    border-radius: 50%; display: flex; align-items: center;
    justify-content: center; box-shadow: 0 2px 12px rgba(124,58,237,0.4);
    cursor: pointer; font-size: 18px; transition: transform 0.2s;
  }
  .ai-btn-v2:hover { transform: scale(1.08); }

  /* ========== 速度选择 ========== */
  .speed-selector-v2 { background: #1a1a1a; border-top: 1px solid #2a2a2a; padding: 12px 20px; }
  .speed-list-v2 { display: flex; gap: 10px; flex-wrap: wrap; }
  .speed-item-v2 {
    padding: 8px 18px; background: #2a2a2a; border-radius: 20px;
    font-size: 13px; color: #aaa; cursor: pointer; transition: all 0.2s;
  }
  .speed-item-v2:hover { background: #3a3a3a; color: #fff; }
  .speed-item-v2.active { background: #7c3aed; color: #fff; }

  /* ========== 答题弹窗 ========== */
  .quiz-popup-overlay-v2 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.75); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 24px;
    backdrop-filter: blur(4px);
  }
  .quiz-popup-box-v2 {
    width: 100%; max-width: 420px; max-height: 85vh; background: #1e1e1e;
    border-radius: 16px; padding: 20px; overflow-y: auto;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5); border: 1px solid #2a2a2a;
  }
  .quiz-popup-header-v2 {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #2a2a2a;
  }
  .quiz-popup-title-v2 { font-size: 16px; font-weight: 600; color: #fff; }
  .quiz-close-btn-v2 {
    width: 28px; height: 28px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; color: #888; cursor: pointer;
    border-radius: 6px; transition: all 0.2s;
  }
  .quiz-close-btn-v2:hover { background: #2a2a2a; color: #fff; }
  .quiz-question-v2 {
    font-size: 15px; color: #e0e0e0; line-height: 1.6; margin-bottom: 16px;
    padding: 14px; background: #252525; border-radius: 8px;
    border-left: 3px solid #7c3aed;
  }
  .quiz-options-v2 { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .quiz-option-v2 {
    display: flex; align-items: center; padding: 12px 14px; background: #252525;
    border-radius: 8px; border: 1px solid #2a2a2a; cursor: pointer;
    transition: all 0.2s;
  }
  .quiz-option-v2:hover { background: #2a2a2a; border-color: #3a3a3a; }
  .quiz-option-v2.selected { border-color: #7c3aed; background: rgba(124,58,237,0.15); }
  .quiz-option-v2.correct { border-color: #22c55e; background: rgba(34,197,94,0.15); }
  .quiz-option-v2.wrong { border-color: #ef4444; background: rgba(239,68,68,0.15); }
  .quiz-option-letter-v2 {
    width: 28px; height: 28px; background: #2a2a2a; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: #aaa; margin-right: 10px;
    flex-shrink: 0;
  }
  .quiz-option-v2.selected .quiz-option-letter-v2 { background: #7c3aed; color: #fff; }
  .quiz-option-v2.correct .quiz-option-letter-v2 { background: #22c55e; color: #fff; }
  .quiz-option-v2.wrong .quiz-option-letter-v2 { background: #ef4444; color: #fff; }
  .quiz-option-text-v2 { font-size: 14px; color: #ddd; flex: 1; }
  .quiz-result-v2 { margin-bottom: 14px; }
  .result-message-v2 {
    padding: 12px; border-radius: 8px; text-align: center;
    font-size: 14px; font-weight: 600; margin-bottom: 10px;
  }
  .result-message-v2.success { background: rgba(34,197,94,0.15); color: #4ade80; }
  .result-message-v2.error { background: rgba(239,68,68,0.15); color: #f87171; }
  .quiz-analysis-v2 {
    padding: 12px; background: #252525; border-radius: 8px;
    font-size: 13px; color: #aaa; line-height: 1.6;
  }
  .quiz-actions-v2 { display: flex; justify-content: center; }
  .quiz-submit-btn-v2 {
    padding: 12px 48px; border-radius: 24px; font-size: 14px; font-weight: 500;
    text-align: center; cursor: pointer; transition: all 0.2s; border: none;
  }
  .quiz-submit-btn-v2.active { background: #7c3aed; color: #fff; }
  .quiz-submit-btn-v2.active:hover { background: #6d28d9; }
  .quiz-submit-btn-v2.disabled { background: #2a2a2a; color: #555; pointer-events: none; }

  /* ========== 互动确认弹窗 ========== */
  .popup-overlay-v2 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); z-index: 9998;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
  }
  .popup-box-v2 {
    width: 320px; background: #1e1e1e; border-radius: 16px;
    padding: 28px 24px; display: flex; flex-direction: column; align-items: center;
    border: 1px solid #2a2a2a; box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  }
  .popup-title-v2 { font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 8px; }
  .popup-desc-v2 { font-size: 14px; color: #aaa; margin-bottom: 24px; text-align: center; }
  .popup-buttons-v2 { display: flex; gap: 16px; width: 100%; }
  .popup-btn-v2 {
    flex: 1; padding: 12px; border-radius: 24px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none;
  }
  .popup-btn-v2.cancel { background: #2a2a2a; color: #aaa; }
  .popup-btn-v2.cancel:hover { background: #3a3a3a; }
  .popup-btn-v2.confirm { background: #7c3aed; color: #fff; }
  .popup-btn-v2.confirm:hover { background: #6d28d9; }

  /* ========== 完成遮罩 ========== */
  .completion-overlay-v2 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.9); z-index: 9997;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px);
  }
  .completion-box-v2 {
    width: 360px; background: #1e1e1e; border-radius: 20px;
    padding: 36px 28px; display: flex; flex-direction: column; align-items: center;
    border: 1px solid #2a2a2a; box-shadow: 0 8px 48px rgba(0,0,0,0.6);
  }
  .completion-icon-v2 {
    width: 68px; height: 68px; background: #22c55e; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; color: #fff; margin-bottom: 16px;
  }
  .completion-title-v2 { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 8px; }
  .completion-desc-v2 { font-size: 14px; color: #aaa; margin-bottom: 24px; }
  .completion-stats-v2 {
    display: flex; justify-content: space-around; width: 100%;
    margin-bottom: 28px; padding: 18px 0;
    border-top: 1px solid #2a2a2a; border-bottom: 1px solid #2a2a2a;
  }
  .completion-stat-item-v2 { display: flex; flex-direction: column; align-items: center; }
  .completion-stat-value-v2 { font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 4px; }
  .completion-stat-label-v2 { font-size: 12px; color: #888; }
  .completion-actions-v2 { display: flex; gap: 10px; width: 100%; }
  .completion-btn-v2 {
    flex: 1; padding: 12px 6px; border-radius: 24px; text-align: center;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none;
  }
  .completion-btn-v2.replay { background: #2a2a2a; color: #ccc; }
  .completion-btn-v2.replay:hover { background: #3a3a3a; }
  .completion-btn-v2.analysis { background: #7c3aed; color: #fff; }
  .completion-btn-v2.analysis:hover { background: #6d28d9; }
  .completion-btn-v2.kg { background: linear-gradient(135deg, #f5576c, #f093fb); color: #fff; }

  @keyframes spin { to { transform: rotate(360deg); } }
`);

// V1 video-play.html 完整逻辑
const StudentVideoLearning = () => {
  const { classId, videoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const DEMO_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  // 视频状态
  const [videoSrc, setVideoSrc] = useState(DEMO_VIDEO); // 默认用演示视频，避免黑屏
  const [videoTitle, setVideoTitle] = useState('加载中...');
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayBtn, setShowPlayBtn] = useState(true);
  const [videoError, setVideoError] = useState('');

  // 进度
  const [currentTime, setCurrentTime] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // 互动节点
  const [interactionNodes, setInteractionNodes] = useState([]);
  const [triggeredNodes, setTriggeredNodes] = useState([]);
  const [answeredSegments, setAnsweredSegments] = useState([]);

  // 答题状态
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);       // 单选/判断/填空用
  const [selectedMultiAnswers, setSelectedMultiAnswers] = useState([]); // 多选题用
  const [fillText, setFillText] = useState('');                      // 填空/简答文本
  const [showAnswerResult, setShowAnswerResult] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [serverAnalysis, setServerAnalysis] = useState('');

  // 弹窗控制
  const [showInteractionConfirm, setShowInteractionConfirm] = useState(false);
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);

  // 播放速度
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0×');

  // 互动控制
  const [enableInteraction, setEnableInteraction] = useState(true);

  // 学习记录
  const studyRecordRef = useRef({
    videoId: null,
    classId: null,
    startTime: '',
    correctAnswers: 0,
    wrongAnswers: 0,
    maxPosition: 0,
    currentSegmentIndex: -1,
  });

  const questionStartTimeRef = useRef(0);
  const recordTimerRef = useRef(null);
  const nodeCheckDoneRef = useRef({});

  // ========== 工具函数 ==========
  const formatTime = (seconds) => {
    if (seconds > 100000) seconds = seconds / 1000;
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const getCurrentSegmentIndex = useCallback((currentTimeMs) => {
    for (let i = interactionNodes.length - 1; i >= 0; i--) {
      if (currentTimeMs >= interactionNodes[i].start) return i;
    }
    return -1;
  }, [interactionNodes]);

  // ========== API ==========
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const method = options.method || 'GET';
    const body = options.body;
    try {
      const res = await request({ method, url, data: body });
      return res;
    } catch (err) {
      console.error('请求失败:', err);
      return { code: -1, data: null, msg: '网络错误' };
    }
  }, []);

  // ========== 行为记录 ==========
  const recordAction = useCallback((action, data = {}) => {
    const record = studyRecordRef.current;
    if (!record.videoId) return;
    const currentSec = Math.floor(currentTime / 1000);
    const segIdx = getCurrentSegmentIndex(currentTime * 1000);
    const segmentId = segIdx >= 0 ? interactionNodes[segIdx]?.segmentId : 0;

    if ((action === 'pause' || action === 'replay') && record.videoId) {
      fetchWithAuth('/api/v1/behavior/record', {
        method: 'POST',
        body: {
          video_id: record.videoId,
          segment_id: segmentId,
          event: action,
          duration: currentTime * 1000,
        },
      }).catch(() => {});
    }
  }, [currentTime, fetchWithAuth, getCurrentSegmentIndex, interactionNodes]);

  const uploadStudyRecord = useCallback(async () => {
    const record = studyRecordRef.current;
    if (!record.videoId) return;
    try {
      const statRes = await fetchWithAuth(`/api/v1/stat/student/${record.videoId}`);
      if (statRes?.data?.status === 'finished') return;
    } catch (e) { /* ignore */ }
    fetchWithAuth('/api/v1/behavior/update-progress', {
      method: 'POST',
      body: { video_id: record.videoId, current_sec: Math.floor(currentTime) },
    }).catch(() => {});
  }, [currentTime, fetchWithAuth]);

  // ========== 加载视频数据 ==========
  useEffect(() => {
    if (videoId) loadVideoData();
  }, [videoId]);

  const loadVideoData = async () => {
    setIsLoading(true);
    setVideoError('');
    try {
      const res = await request.get(`/video/getDetail/${videoId}`);
      console.log('[VideoLearning] API 返回数据:', JSON.stringify(res, null, 2));
      if ((res.code === 0 || res.code === 200) && res.data) {
        processVideoData(res.data);
      } else {
        const msg = '视频数据异常，请联系管理员';
        setVideoError(msg);
        message.error(msg);
      }
    } catch (err) {
      console.error('[VideoLearning] 加载视频失败:', err);
      // 接口不可用时自动使用演示视频
      setVideoSrc(DEMO_VIDEO);
      setVideoTitle(searchParams.get('title') || '演示视频（后端未连接）');
      const msg = '后端接口未连接，正在播放演示视频';
      setVideoError(msg);
      console.log('[VideoLearning]', msg);
    } finally {
      setIsLoading(false);
    }
  };


  const processVideoData = (videoData) => {
    const possibleUrlFields = ['url', 'play_url', 'video_url', 'videoUrl', 'src', 'video_src'];
    let rawUrl = '';
    for (const field of possibleUrlFields) {
      if (videoData[field]) { rawUrl = videoData[field]; break; }
    }
    console.log('[VideoLearning] 原始视频 URL:', rawUrl || '(空)');

    // 处理相对路径：以 / 开头但不以 /api 开头的路径，通过 Vite proxy 代理访问
    let videoUrl = rawUrl;
    if (rawUrl && rawUrl.startsWith('/') && !rawUrl.startsWith('/api/') && !rawUrl.startsWith('/api?')) {
      videoUrl = '/api/v1' + rawUrl;
      console.log('[VideoLearning] 相对路径已转换为代理路径:', videoUrl);
    }

    if (!videoUrl) {
      // 后端视频源不可用时，使用演示视频兜底（比赛演示用）
      videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
      console.log('[VideoLearning] 使用演示视频兜底:', videoUrl);
    }

    setVideoSrc(videoUrl);

    let duration = videoData.duration || 0;
    if (duration < 10000) duration = duration * 1000;
    setVideoDuration(duration);

    const title = searchParams.get('title') || videoData.title || videoData.name || '视频课程';
    setVideoTitle(decodeURIComponent(title));

    // 处理互动节点
    const segmentsData = videoData.segments || videoData.segment_list || [];
    const nodes = [];
    if (segmentsData && Array.isArray(segmentsData) && segmentsData.length > 0) {
      segmentsData.forEach((seg, index) => {
        const questionData = seg.question || seg.questions || seg.problem || seg.quiz || null;
        // 过滤空对象/无实质内容的题目
        if (questionData && typeof questionData === 'object' && Object.keys(questionData).length > 0) {
          // 跳过没有 type/content/title 的空题目
          const hasContent = questionData.content || questionData.title || questionData.question || questionData.text;
          if (!hasContent) return;

          const startMs = seg.start || seg.start_time || 0;
          const endMs = seg.end || seg.end_time || (seg.start || seg.start_time || 0) + 300000;
          const triggerTimeMs = endMs - 1000;
          const progressPct = duration > 0 ? (triggerTimeMs / duration) * 100 : 0;

          // 使用共享标准化函数
          const normalized = normalizeQuestionData({
            ...questionData,
            id: questionData.id || seg.id || seg.segment_id,
          });

          nodes.push({
            id: seg.id || index,
            segmentId: seg.id || seg.segment_id,
            start: startMs,
            end: endMs,
            time: triggerTimeMs / 1000,
            progressPercent: progressPct,
            question: {
              ...normalized,
              title: normalized.content || questionData.title || questionData.text || '题目内容',
              answer: questionData.answer || questionData.correct_answer || questionData.answer_key || '',
              analysis: questionData.analysis || questionData.explanation || '',
              knowledge: questionData.knowledge || questionData.knowledge_point || '',
            },
          });
        }
      });
    }
    setInteractionNodes(nodes);

    const now = getCurrentTimeStr();
    studyRecordRef.current = {
      videoId: parseInt(videoId),
      classId,
      startTime: now,
      correctAnswers: 0,
      wrongAnswers: 0,
      maxPosition: 0,
      currentSegmentIndex: -1,
    };

    // 启动学习计时
    recordTimerRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        studyRecordRef.current.maxPosition = Math.max(
          studyRecordRef.current.maxPosition,
          videoRef.current.currentTime
        );
      }
    }, 1000);
  };

  // ========== 视频事件处理 ==========
  const handlePlay = () => {
    setIsPlaying(true);
    setShowPlayBtn(false);
    setIsLoading(false);
    recordAction('play');
  };

  const handlePause = () => {
    setIsPlaying(false);
    recordAction('pause');
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const rawTime = video.currentTime;
    const currentTimeMs = rawTime > 100000 ? rawTime : Math.floor(rawTime * 1000);
    const rawDuration = video.duration || 0;
    const durationMs = rawDuration > 100000 ? rawDuration : Math.floor(rawDuration * 1000);
    const progress = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

    setCurrentTime(currentTimeMs);
    if (durationMs > 0 && videoDuration === 0) setVideoDuration(durationMs);
    setProgressPercent(progress);

    // 检查互动节点
    if (enableInteraction && !showQuestionPopup && !showInteractionConfirm) {
      for (let i = 0; i < interactionNodes.length; i++) {
        const node = interactionNodes[i];
        const triggerTimeMs = node.time * 1000;
        const timeDiff = Math.abs(currentTimeMs - triggerTimeMs);
        const key = `${videoId}_${node.id}`;

        if (timeDiff <= 1500 && !triggeredNodes.includes(node.id) && !answeredSegments.includes(node.segmentId) && !nodeCheckDoneRef.current[key]) {
          nodeCheckDoneRef.current[key] = true;
          video.pause();
          triggerInteraction(node, i);
          break;
        }
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowPlayBtn(true);
    setShowCompletion(true);
    recordAction('end');

    const record = studyRecordRef.current;
    if (!record.videoId) return;
    const durationMs = videoDuration;
    fetchWithAuth('/api/v1/behavior/update-progress', {
      method: 'POST',
      body: { video_id: record.videoId, current_sec: Math.floor(durationMs / 1000) },
    }).catch(() => {});
  };

  // ========== 互动触发 ==========
  const triggerInteraction = (node, index) => {
    setTriggeredNodes((prev) => [...prev, node.id]);
    const qData = node.question || {};
    setCurrentQuestionIndex(index);
    setCurrentQuestion({
      id: qData.id || node.id,
      type: qData.type || QUESTION_TYPE.SINGLE_CHOICE,       // 题型 — 必须传递
      title: qData.title || qData.content || '题目内容',
      options: qData.options || [],
      answer: qData.answer || '',
      parsedAnswer: qData.parsedAnswer || qData.answer || '', // 解析后的答案 — 用于比对
      analysis: qData.analysis || '',
      knowledge: qData.knowledge || '',
      segmentId: node.segmentId,
      segmentStart: node.start,
      segmentEnd: node.end,
      difficulty: qData.difficulty || 0.5,
    });
    setSelectedAnswer(null);
    setSelectedMultiAnswers([]);
    setFillText('');
    setShowAnswerResult(false);
    setIsAnswerCorrect(false);
    setServerAnalysis('');
    questionStartTimeRef.current = Date.now();

    if (enableInteraction) {
      setShowQuestionPopup(true);
    } else {
      setShowInteractionConfirm(true);
    }
  };

  // ========== 答题提交 ==========
  const submitAnswerToServer = async (payLoad, timeCost) => {
    if (!payLoad || !studyRecordRef.current.videoId) return;

    const payload = {
      ...payLoad,
      question_id: payLoad.question_id || currentQuestion?.id,
      time_cost: timeCost,
    };

    try {
      const res = await fetchWithAuth('/api/v1/question/answer', {
        method: 'POST',
        body: {
          video_id: studyRecordRef.current.videoId,
          studentanswers: [payload],
        },
      });
      if (res && (res.code === 0 || res.code === 200) && res.data?.results?.[0]) {
        const result = res.data.results[0];
        if (result.analysis) setServerAnalysis(result.analysis);
      }
    } catch (err) {
      console.error('提交答案失败:', err);
    }
  };

  const submitPopupAnswer = () => {
    const qType = currentQuestion?.type;
    const meta = QUESTION_TYPE_META[qType];

    // 校验各题型输入
    if (meta?.hasOptions && selectedAnswer === null) {
      message.info('请先选择答案'); return;
    }
    if (qType === QUESTION_TYPE.MULTIPLE_CHOICE && selectedMultiAnswers.length === 0) {
      message.info('请至少选择一个答案'); return;
    }
    if ((qType === QUESTION_TYPE.FILL_BLANK || qType === QUESTION_TYPE.SHORT_ANSWER) && !fillText.trim()) {
      message.info('请先输入答案'); return;
    }

    const timeCost = Date.now() - questionStartTimeRef.current;

    // 判断对错
    let correct;
    const qAnswer = currentQuestion?.answer;
    const qParsedAnswer = currentQuestion?.parsedAnswer;

    if (qType === QUESTION_TYPE.SINGLE_CHOICE) {
      // 单选：selectedAnswer 是字母 "A"，parsedAnswer 也是字母 "A"
      correct = selectedAnswer === qParsedAnswer;
    } else if (qType === QUESTION_TYPE.TRUE_FALSE) {
      // 判断：selectedAnswer 是字母 "A"/"B"，需映射到选项文本 "对"/"错" 再比较
      const selectedOpt = qOptions.find(o => o.letter === selectedAnswer);
      correct = selectedOpt?.text === qParsedAnswer;
    } else if (qType === QUESTION_TYPE.MULTIPLE_CHOICE) {
      correct = isAnswerCorrect(selectedMultiAnswers, qParsedAnswer || qAnswer, qType);
    } else if (qType === QUESTION_TYPE.FILL_BLANK) {
      correct = isAnswerCorrect(fillText.trim(), qParsedAnswer || qAnswer, qType);
    } else {
      // short_answer: 只要有输入就视为可提交
      correct = fillText.trim().length > 0;
    }

    setShowAnswerResult(true);
    setIsAnswerCorrect(correct);

    const record = studyRecordRef.current;
    if (correct) record.correctAnswers++; else record.wrongAnswers++;

    // 标记已回答
    setAnsweredSegments((prev) => prev.includes(currentQuestion.segmentId) ? prev : [...prev, currentQuestion.segmentId]);

    // 构建提交 payload
    let answerValue;
    if (qType === QUESTION_TYPE.MULTIPLE_CHOICE) {
      answerValue = selectedMultiAnswers;
    } else if (qType === QUESTION_TYPE.FILL_BLANK || qType === QUESTION_TYPE.SHORT_ANSWER) {
      answerValue = fillText.trim();
    } else {
      answerValue = selectedAnswer;
    }

    const apiPayload = buildAnswerPayload(currentQuestion.id, answerValue, qType, timeCost);
    submitAnswerToServer(apiPayload, timeCost);

    // 自动关闭弹窗并继续播放
    setTimeout(() => {
      setShowQuestionPopup(false);
      setSelectedAnswer(null);
      setSelectedMultiAnswers([]);
      setFillText('');
      setShowAnswerResult(false);
      if (videoRef.current) videoRef.current.play();
    }, 1500);
  };

  const closeQuestionPopup = () => {
    if (currentQuestion?.segmentId) {
      setAnsweredSegments((prev) => prev.includes(currentQuestion.segmentId) ? prev : [...prev, currentQuestion.segmentId]);
    }
    setShowQuestionPopup(false);
    setSelectedAnswer(null);
    setSelectedMultiAnswers([]);
    setFillText('');
    setShowAnswerResult(false);
    if (videoRef.current) videoRef.current.pause();
  };

  const confirmInteraction = () => {
    const idx = currentQuestionIndex;
    if (idx >= 0 && idx < interactionNodes.length) {
      const newTriggered = [...triggeredNodes];
      if (!newTriggered.includes(interactionNodes[idx].id)) {
        newTriggered.push(interactionNodes[idx].id);
      }
      setTriggeredNodes(newTriggered);
    }
    setShowInteractionConfirm(false);
    setSelectedAnswer(null);
    setSelectedMultiAnswers([]);
    setFillText('');
    setShowAnswerResult(false);
    setShowQuestionPopup(true);
  };

  const cancelInteraction = () => {
    if (currentQuestion?.segmentId) {
      setAnsweredSegments((prev) => prev.includes(currentQuestion.segmentId) ? prev : [...prev, currentQuestion.segmentId]);
    }
    setShowInteractionConfirm(false);
    setSelectedAnswer(null);
    setSelectedMultiAnswers([]);
    setFillText('');
    if (videoRef.current) videoRef.current.pause();
  };

  // ========== 视频控制 ==========
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); } else { video.pause(); }
  };

  const tapProgressBar = (e) => {
    const video = videoRef.current;
    if (!video || !videoDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * (videoDuration / 1000);
    video.currentTime = seekTime;
  };

  const selectSpeed = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedOptions(false);
    if (videoRef.current) videoRef.current.playbackRate = parseFloat(speed);
  };

  const toggleInteraction = () => {
    setEnableInteraction((prev) => {
      message.info(prev ? '已关闭互动' : '已开启互动');
      return !prev;
    });
  };

  const replayVideo = () => {
    setShowCompletion(false);
    setShowPlayBtn(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const openAI = () => {
    if (videoRef.current && !videoRef.current.paused) videoRef.current.pause();
    navigate(`/student/chat?videoId=${videoId}&videoTitle=${encodeURIComponent(videoTitle)}&currentTime=${encodeURIComponent(formatTime(currentTime / 1000))}&videoDuration=${videoDuration}`);
  };

  // ========== 返回处理 ==========
  const goBack = async () => {
    const record = studyRecordRef.current;
    if (!record.videoId || !videoRef.current || videoRef.current.currentTime <= 0) {
      navigate(-1);
      return;
    }
    try {
      const statRes = await fetchWithAuth(`/api/v1/stat/student/${record.videoId}`);
      if (statRes?.data?.status !== 'finished') {
        fetchWithAuth('/api/v1/behavior/update-progress', {
          method: 'POST',
          body: { video_id: record.videoId, current_sec: Math.floor(videoRef.current.currentTime) },
        }).catch(() => {});
      }
    } catch (e) {
      fetchWithAuth('/api/v1/behavior/update-progress', {
        method: 'POST',
        body: { video_id: record.videoId, current_sec: Math.floor(videoRef.current.currentTime) },
      }).catch(() => {});
    }
    navigate(-1);
  };

  // 页面卸载清理
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      uploadStudyRecord();
    };
  }, []);

  // ========== 渲染 ==========
  const completionRate = videoDuration > 0 ? Math.min(100, Math.round((currentTime / videoDuration) * 100)) : 0;
  const totalQuestions = studyRecordRef.current.correctAnswers + studyRecordRef.current.wrongAnswers;
  const correctAnswers = studyRecordRef.current.correctAnswers;

  return (
    <div className="video-play-container-v2">
      {/* 导航栏 */}
      <div className="video-nav-bar-v2">
        <div className="video-nav-back-v2" onClick={goBack}>←</div>
        <div className="video-nav-title-v2">{videoTitle}</div>
        <div className="video-nav-right-v2" />
      </div>

      {/* 主内容区 */}
      <div className="video-main-area-v2">
        {/* 视频播放区 */}
        <div className="video-section-v2" onClick={togglePlay}>
          {isLoading && (
            <div className="video-placeholder-v2">
              <div className="video-spinner-v2" />
              <div className="video-loading-text-v2">正在加载视频...</div>
            </div>
          )}
          {!isLoading && videoError && (
            <div className="video-placeholder-v2">
              <div style={{ color: '#f87171', fontSize: 48, marginBottom: 16 }}>⚠</div>
              <div style={{ color: '#ccc', fontSize: 15, padding: '0 20px', textAlign: 'center', lineHeight: 1.6 }}>{videoError}</div>
              <div
                style={{ color: '#7c3aed', fontSize: 13, marginTop: 16, cursor: 'pointer', padding: '8px 20px', border: '1px solid #7c3aed', borderRadius: 20 }}
                onClick={() => loadVideoData()}
              >
                点击重试
              </div>
            </div>
          )}
          <video
            ref={videoRef}
            className="video-player-v2"
            src={videoSrc}
            preload="auto"
            playsInline
            webkit-playsinline="true"
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onCanPlay={() => { setIsLoading(false); }}
            onWaiting={() => setIsLoading(true)}
          />
          {showPlayBtn && !isPlaying && !isLoading && (
            <div className="video-cover-v2" onClick={(e) => { e.stopPropagation(); videoRef.current?.play(); }}>
              <div className="play-btn-large-v2">▶</div>
            </div>
          )}
        </div>

        {/* 进度条控制区域 */}
        <div className="progress-control-bar-v2">
          <div className="progress-row-v2">
            <span className="time-info-v2">{formatTime(currentTime / 1000)}</span>
            <div className="progress-track-wrapper-v2" onClick={tapProgressBar}>
              <div className="progress-fill-v2" style={{ width: `${progressPercent}%` }} />
              {interactionNodes.map((node, i) => (
                <div
                  key={i}
                  className={`progress-node-v2 ${triggeredNodes.includes(node.id) ? 'triggered' : ''} ${answeredSegments.includes(node.segmentId) ? 'answered' : ''}`}
                  style={{ left: `${node.progressPercent}%` }}
                  title={`互动节点: ${formatTime(node.time)}`}
                />
              ))}
              <div className="progress-thumb-v2" style={{ left: `${progressPercent}%` }} />
            </div>
            <span className="time-info-v2">{formatTime(videoDuration / 1000)}</span>
          </div>
          <div className="control-row-v2">
            <div className="control-left-v2">
              <div className="control-btn-v2 play-pause-btn-v2" onClick={togglePlay}>
                <span>{isPlaying ? '⏸' : '▶'}</span>
              </div>
              <div className="control-btn-v2" onClick={() => setShowSpeedOptions(!showSpeedOptions)} title="播放速度">
                <span style={{ fontSize: 12, fontWeight: 600 }}>{playbackSpeed}</span>
              </div>
            </div>
            <div className="control-right-v2">
              <div
                className={`control-btn-v2 interaction-toggle-v2 ${enableInteraction ? 'active' : ''}`}
                onClick={toggleInteraction}
                title={enableInteraction ? '互动已开启' : '互动已关闭'}
              >
                <span style={{ fontSize: 12 }}>弹题</span>
              </div>
              <div
                className="control-btn-v2"
                onClick={() => navigate(`/student/small-kg?videoId=${videoId}&classId=${classId || ''}&title=${encodeURIComponent(videoTitle)}`)}
                title="知识图谱"
              >
                <span>🕸</span>
              </div>
              <div className="ai-btn-v2" onClick={openAI} title="AI 助手">
                <span>🤖</span>
              </div>
            </div>
          </div>
        </div>

        {/* 速度选择面板 */}
        {showSpeedOptions && (
          <div className="speed-selector-v2">
            <div className="speed-list-v2">
              {['0.5×', '0.75×', '1.0×', '1.25×', '1.5×', '2.0×'].map((s) => (
                <div key={s} className={`speed-item-v2 ${playbackSpeed === s ? 'active' : ''}`} onClick={() => selectSpeed(s)}>{s}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 互动答题弹窗 — 多题型支持 */}
      {showQuestionPopup && currentQuestion && (() => {
        const qType = currentQuestion.type;
        const qMeta = QUESTION_TYPE_META[qType];
        const qOptions = currentQuestion.options || [];
        const qParsedAnswer = currentQuestion.parsedAnswer;
        const isMulti = qType === QUESTION_TYPE.MULTIPLE_CHOICE;
        const isFill = qType === QUESTION_TYPE.FILL_BLANK || qType === QUESTION_TYPE.SHORT_ANSWER;

        return (
          <div className="quiz-popup-overlay-v2" onClick={closeQuestionPopup}>
            <div className="quiz-popup-box-v2" onClick={(e) => e.stopPropagation()}>
              <div className="quiz-popup-header-v2">
                <span className="quiz-popup-title-v2">
                  {qMeta?.icon || '📝'} {qMeta?.shortLabel || '答题'}
                </span>
                <span className="quiz-close-btn-v2" onClick={closeQuestionPopup}>✕</span>
              </div>

              {/* 题目内容 */}
              <div className="quiz-question-v2">{currentQuestion.title}</div>

              {/* --- 单选/判断题 选项区 --- */}
              {(qType === QUESTION_TYPE.SINGLE_CHOICE || qType === QUESTION_TYPE.TRUE_FALSE) && (
                <div className="quiz-options-v2">
                  {qOptions.map((opt, i) => {
                    const isCorrectOpt = showAnswerResult && opt.letter === qParsedAnswer;
                    const isWrongOpt = showAnswerResult && selectedAnswer === opt.letter && opt.letter !== qParsedAnswer;
                    let cls = 'quiz-option-v2';
                    if (selectedAnswer === opt.letter) cls += ' selected';
                    if (isCorrectOpt) cls += ' correct';
                    if (isWrongOpt) cls += ' wrong';
                    return (
                      <div key={i} className={cls} onClick={() => { if (!showAnswerResult) setSelectedAnswer(opt.letter); }}>
                        <div className="quiz-option-letter-v2">{opt.letter}</div>
                        <span className="quiz-option-text-v2">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* --- 多选题 选项区 --- */}
              {qType === QUESTION_TYPE.MULTIPLE_CHOICE && (
                <div className="quiz-options-v2">
                  <Checkbox.Group
                    value={selectedMultiAnswers}
                    onChange={setSelectedMultiAnswers}
                    disabled={showAnswerResult}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {qOptions.map((opt, i) => {
                      const isCorrectOpt = showAnswerResult && Array.isArray(qParsedAnswer) && qParsedAnswer.includes(opt.letter);
                      const isWrongOpt = showAnswerResult && selectedMultiAnswers.includes(opt.letter) && !(Array.isArray(qParsedAnswer) && qParsedAnswer.includes(opt.letter));
                      return (
                        <div
                          key={i}
                          className={`quiz-option-v2${isCorrectOpt ? ' correct' : ''}${isWrongOpt ? ' wrong' : ''}${selectedMultiAnswers.includes(opt.letter) ? ' selected' : ''}`}
                        >
                          <Checkbox value={opt.letter} style={{ width: '100%' }}>
                            <span style={{ fontSize: 14, color: '#ddd' }}>
                              <b style={{ color: '#aaa', marginRight: 6 }}>{opt.letter}.</b>
                              {opt.text}
                            </span>
                          </Checkbox>
                        </div>
                      );
                    })}
                  </Checkbox.Group>
                </div>
              )}

              {/* --- 填空/简答 输入区 --- */}
              {isFill && (
                <div style={{ marginBottom: 12 }}>
                  <textarea
                    value={fillText}
                    onChange={(e) => setFillText(e.target.value)}
                    placeholder={qType === QUESTION_TYPE.FILL_BLANK ? '请输入答案，多个空用逗号分隔...' : '请输入你的答案...'}
                    disabled={showAnswerResult}
                    rows={3}
                    style={{
                      width: '100%', padding: 12, borderRadius: 8,
                      background: '#252525', border: '1px solid #3a3a3a',
                      color: '#e0e0e0', fontSize: 14, resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* 结果反馈 */}
              {showAnswerResult && (
                <div className="quiz-result-v2">
                  <div className={`result-message-v2 ${isAnswerCorrect ? 'success' : 'error'}`}>
                    {isAnswerCorrect ? '✓ 回答正确！' : '✗ 回答错误'}
                    {!isAnswerCorrect && qParsedAnswer && (
                      <span style={{ marginLeft: 8, fontSize: 12 }}>
                        （正确答案：{Array.isArray(qParsedAnswer) ? qParsedAnswer.join(', ') : String(qParsedAnswer)}）
                      </span>
                    )}
                  </div>
                  {!isAnswerCorrect && (serverAnalysis || currentQuestion.analysis) && (
                    <div className="quiz-analysis-v2">{serverAnalysis || currentQuestion.analysis}</div>
                  )}
                </div>
              )}

              {/* 提交按钮 */}
              <div className="quiz-actions-v2">
                {(() => {
                  const canSubmit = !showAnswerResult && (
                    (qType === QUESTION_TYPE.MULTIPLE_CHOICE && selectedMultiAnswers.length > 0) ||
                    (isFill && fillText.trim()) ||
                    (!isMulti && !isFill && selectedAnswer !== null)
                  );
                  return (
                    <div
                      className={`quiz-submit-btn-v2 ${canSubmit ? 'active' : 'disabled'}`}
                      onClick={canSubmit ? submitPopupAnswer : undefined}
                    >
                      {showAnswerResult ? '已完成' : '提交答案'}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 互动确认弹窗 */}
      {showInteractionConfirm && (
        <div className="popup-overlay-v2" onClick={cancelInteraction}>
          <div className="popup-box-v2" onClick={(e) => e.stopPropagation()}>
            <div className="popup-title-v2">是否进行互动?</div>
            <div className="popup-desc-v2">视频将在互动点暂停，请回答问题</div>
            <div className="popup-buttons-v2">
              <div className="popup-btn-v2 cancel" onClick={cancelInteraction}>取消</div>
              <div className="popup-btn-v2 confirm" onClick={confirmInteraction}>确认</div>
            </div>
          </div>
        </div>
      )}

      {/* 视频完成遮罩层 */}
      {showCompletion && (
        <div className="completion-overlay-v2">
          <div className="completion-box-v2">
            <div className="completion-icon-v2">✓</div>
            <div className="completion-title-v2">视频已播放完成</div>
            <div className="completion-desc-v2">恭喜您完成了本次视频学习</div>
            <div className="completion-stats-v2">
              <div className="completion-stat-item-v2">
                <span className="completion-stat-value-v2">{completionRate}%</span>
                <span className="completion-stat-label-v2">完成度</span>
              </div>
              <div className="completion-stat-item-v2">
                <span className="completion-stat-value-v2">{totalQuestions}</span>
                <span className="completion-stat-label-v2">答题数</span>
              </div>
              <div className="completion-stat-item-v2">
                <span className="completion-stat-value-v2">{correctAnswers}</span>
                <span className="completion-stat-label-v2">正确数</span>
              </div>
            </div>
            <div className="completion-actions-v2">
              <div className="completion-btn-v2 replay" onClick={replayVideo}>重新播放</div>
              <div className="completion-btn-v2 analysis" onClick={() => navigate(`/student/report?videoId=${videoId}&title=${encodeURIComponent(videoTitle)}`)}>学情分析</div>
              <div className="completion-btn-v2 kg" onClick={() => navigate(`/student/small-kg?videoId=${videoId}&classId=${classId || ''}&title=${encodeURIComponent(videoTitle)}`)}>知识图谱</div>
            </div>
          </div>
        </div>
      )}

      {/* 视频底部信息区 */}
      {!isLoading && !videoError && (
        <div style={{
          background: '#1a1a1a', padding: '16px 20px',
          borderTop: '1px solid #2a2a2a', flexShrink: 0,
        }}>
          <div style={{ color: '#888', fontSize: 12 }}>
            当前进度 {completionRate}% · 已答 {totalQuestions} 题 · 正确 {correctAnswers} 题
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentVideoLearning;
