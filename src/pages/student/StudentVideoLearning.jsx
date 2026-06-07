import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-video', `
  .video-play-container {
    max-width: 480px; margin: 0 auto; min-height: 100vh;
    background: #fff; position: relative;
  }
  @media (min-width: 481px) { .video-play-container { max-width: 100%; } }
  .video-nav-bar {
    display: flex; align-items: center; justify-content: space-between;
    height: 44px; background: #1a1a1a; color: #fff; padding: 0 15px;
    position: sticky; top: 0; z-index: 200;
  }
  .video-nav-back {
    width: 30px; height: 30px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; font-size: 20px; font-weight: bold;
  }
  .video-nav-title {
    font-size: 16px; font-weight: 500; flex: 1; text-align: center;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 10px;
  }
  .video-nav-right { width: 30px; }
  .video-section-v1 { position: relative; width: 100%; background: #000; height: 200px; }
  .video-player-v1 { width: 100%; height: 200px; display: block; object-fit: contain; background: #000; }
  .video-placeholder-v1 {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: #000; display: flex; flex-direction: column;
    align-items: center; justify-content: center; z-index: 1;
  }
  .video-spinner-v1 {
    width: 30px; height: 30px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 1s linear infinite; margin-bottom: 8px;
  }
  .video-loading-text-v1 { color: #fff; font-size: 14px; }
  .video-cover-v1 {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); display: flex;
    align-items: center; justify-content: center; z-index: 5;
  }
  .play-btn-large-v1 {
    width: 60px; height: 60px; background: rgba(255,255,255,0.9);
    border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 25px; color: #333;
    padding-left: 5px; cursor: pointer;
  }
  .progress-control-bar-v1 { background: #fff; padding: 10px 15px 8px; border-bottom: 1px solid #f0f0f0; }
  .progress-row-v1 { display: flex; align-items: center; margin-bottom: 8px; }
  .time-info-v1 { font-size: 12px; color: #666; min-width: 40px; text-align: center; }
  .progress-track-wrapper-v1 {
    flex: 1; position: relative; height: 6px; background: #e5e5e5;
    border-radius: 3px; margin: 0 10px; cursor: pointer;
  }
  .progress-fill-v1 {
    position: absolute; top: 0; left: 0; height: 100%;
    background: linear-gradient(90deg, #7c3aed, #a78bfa); border-radius: 3px;
  }
  .progress-thumb-v1 {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 14px; height: 14px; background: #fff;
    border: 2px solid #7c3aed; border-radius: 50%;
  }
  .progress-node-v1 {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 14px; height: 14px; border-radius: 50%; background: #f59e0b;
    border: 2px solid #fff; box-shadow: 0 0 6px rgba(245,158,11,0.6);
    cursor: pointer; z-index: 10;
  }
  .progress-node-v1.triggered { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.6); }
  .progress-node-v1.answered { background: #22c55e; }
  .control-row-v1 { display: flex; align-items: center; justify-content: space-between; padding-top: 5px; }
  .control-left-v1, .control-right-v1 { display: flex; align-items: center; gap: 10px; }
  .control-btn-v1 {
    width: 32px; height: 32px; background: #f5f5f5; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #333; font-size: 12px; cursor: pointer;
  }
  .play-pause-btn-v1 {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    color: #fff; font-size: 16px;
  }
  .interaction-toggle-v1.active { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .ai-float-btn-v1 {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    border-radius: 50%; display: flex; align-items: center;
    justify-content: center; box-shadow: 0 2px 10px rgba(124,58,237,0.4);
    cursor: pointer; font-size: 16px;
  }
  .speed-selector-v1 { background: #fff; border-top: 1px solid #f0f0f0; padding: 10px 15px; }
  .speed-list-v1 { display: flex; gap: 8px; flex-wrap: wrap; }
  .speed-item-v1 {
    padding: 8px 16px; background: #f5f5f5; border-radius: 20px;
    font-size: 13px; color: #666; cursor: pointer;
  }
  .speed-item-v1.active { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .quiz-popup-overlay-v1 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .quiz-popup-box-v1 {
    width: 100%; max-width: 325px; max-height: 80vh; background: #fff;
    border-radius: 12px; padding: 15px; overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }
  .quiz-popup-header-v1 {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e5e5;
  }
  .quiz-popup-title-v1 { font-size: 16px; font-weight: 600; color: #333; }
  .quiz-close-btn-v1 {
    width: 25px; height: 25px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; color: #999; cursor: pointer;
  }
  .quiz-question-v1 {
    font-size: 15px; color: #333; line-height: 1.5; margin-bottom: 15px;
    padding: 12px; background: #f8f9fa; border-radius: 6px;
  }
  .quiz-options-v1 { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .quiz-option-v1 {
    display: flex; align-items: center; padding: 11px; background: #f5f5f5;
    border-radius: 6px; border: 1px solid transparent; cursor: pointer;
  }
  .quiz-option-v1.selected { border-color: #8b5cf6; background: #f3e8ff; }
  .quiz-option-v1.correct { border-color: #22c55e; background: #dcfce7; }
  .quiz-option-v1.wrong { border-color: #ef4444; background: #fee2e2; }
  .quiz-option-letter-v1 {
    width: 24px; height: 24px; background: #e5e5e5; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: #666; margin-right: 8px;
  }
  .quiz-option-v1.selected .quiz-option-letter-v1 { background: #8b5cf6; color: #fff; }
  .quiz-option-v1.correct .quiz-option-letter-v1 { background: #22c55e; color: #fff; }
  .quiz-option-v1.wrong .quiz-option-letter-v1 { background: #ef4444; color: #fff; }
  .quiz-option-text-v1 { font-size: 13px; color: #333; flex: 1; }
  .quiz-result-v1 { margin-bottom: 10px; }
  .result-message-v1 {
    padding: 10px; border-radius: 6px; text-align: center;
    font-size: 14px; font-weight: 600; margin-bottom: 8px;
  }
  .result-message-v1.success { background: #dcfce7; color: #22c55e; }
  .result-message-v1.error { background: #fee2e2; color: #ef4444; }
  .quiz-analysis-v1 {
    padding: 10px; background: #f8f9fa; border-radius: 6px;
    font-size: 12px; color: #666; line-height: 1.5;
  }
  .quiz-actions-v1 { display: flex; justify-content: center; }
  .quiz-submit-btn-v1 {
    padding: 12px 40px; border-radius: 25px; font-size: 14px;
    text-align: center; cursor: pointer;
  }
  .quiz-submit-btn-v1.active { background: #8b5cf6; color: #fff; }
  .quiz-submit-btn-v1.disabled { background: #e5e5e5; color: #999; pointer-events: none; }
  .popup-overlay-v1 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 9998;
    display: flex; align-items: center; justify-content: center;
  }
  .popup-box-v1 {
    width: 280px; background: #fff; border-radius: 12px;
    padding: 25px 20px; display: flex; flex-direction: column; align-items: center;
  }
  .popup-title-v1 { font-size: 17px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .popup-desc-v1 { font-size: 13px; color: #666; margin-bottom: 20px; text-align: center; }
  .popup-buttons-v1 { display: flex; gap: 15px; width: 100%; }
  .popup-btn-v1 { flex: 1; padding: 12px; border-radius: 25px; text-align: center; font-size: 15px; cursor: pointer; }
  .popup-btn-v1.cancel { background: #e5e5e5; color: #999; }
  .popup-btn-v1.confirm { background: #8b5cf6; color: #fff; }
  .completion-overlay-v1 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85); z-index: 9997;
    display: flex; align-items: center; justify-content: center;
  }
  .completion-box-v1 {
    width: 300px; background: #fff; border-radius: 16px;
    padding: 30px 25px; display: flex; flex-direction: column; align-items: center;
  }
  .completion-icon-v1 {
    width: 60px; height: 60px; background: #22c55e; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; color: #fff; margin-bottom: 15px;
  }
  .completion-title-v1 { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .completion-desc-v1 { font-size: 13px; color: #666; margin-bottom: 20px; }
  .completion-stats-v1 {
    display: flex; justify-content: space-around; width: 100%;
    margin-bottom: 25px; padding: 15px 0;
    border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;
  }
  .completion-stat-item-v1 { display: flex; flex-direction: column; align-items: center; }
  .completion-stat-value-v1 { font-size: 20px; font-weight: 600; color: #8b5cf6; margin-bottom: 5px; }
  .completion-stat-label-v1 { font-size: 11px; color: #999; }
  .completion-actions-v1 { display: flex; gap: 10px; width: 100%; }
  .completion-btn-v1 {
    flex: 1; padding: 12px 8px; border-radius: 25px; text-align: center;
    font-size: 13px; font-weight: 500; cursor: pointer;
  }
  .completion-btn-v1.replay { background: #f5f5f5; color: #666; border: 1px solid #e5e5e5; }
  .completion-btn-v1.analysis { background: #8b5cf6; color: #fff; }
  .completion-btn-v1.quiz { background: linear-gradient(135deg, #f5576c, #f093fb); color: #fff; }
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
  const [selectedAnswer, setSelectedAnswer] = useState(null);
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

  const formatOptions = (options) => {
    if (!options) return [];
    if (Array.isArray(options)) {
      return options.map((opt, i) => {
        if (typeof opt === 'string') return { id: i, letter: String.fromCharCode(65 + i), text: opt };
        return { id: i, letter: opt.letter || opt.label || String.fromCharCode(65 + i), text: opt.text || opt.option || opt.content || String(opt) };
      });
    }
    return [];
  };

  const getAnswerIndex = (options, answer) => {
    if (!options || answer === undefined || answer === null) return 0;
    const answerStr = String(answer).toUpperCase();
    if (typeof answer === 'number') return answer;
    if (/^\d+$/.test(answerStr)) return parseInt(answerStr);
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (typeof opt === 'string') { if (opt.toUpperCase() === answerStr) return i; }
      else { if ((opt.label || '').toUpperCase() === answerStr || (opt.letter || '').toUpperCase() === answerStr) return i; }
    }
    const letterIndex = answerStr.charCodeAt(0) - 65;
    return (letterIndex >= 0 && letterIndex < options.length) ? letterIndex : 0;
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
        if (questionData) {
          const startMs = seg.start || seg.start_time || 0;
          const endMs = seg.end || seg.end_time || (seg.start || seg.start_time || 0) + 300000;
          const triggerTimeMs = endMs - 1000;
          const progressPct = duration > 0 ? (triggerTimeMs / duration) * 100 : 0;
          const options = formatOptions(questionData.options);
          const answerIdx = getAnswerIndex(questionData.options, questionData.answer || questionData.correct_answer || 0);

          nodes.push({
            id: seg.id || index,
            segmentId: seg.id || seg.segment_id,
            start: startMs,
            end: endMs,
            time: triggerTimeMs / 1000,
            progressPercent: progressPct,
            question: {
              id: questionData.id || seg.id || seg.segment_id,
              title: questionData.content || questionData.title || questionData.text || questionData.question || '题目内容',
              options,
              answerIndex: answerIdx,
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
      title: qData.title || qData.content || '题目内容',
      options: qData.options || [],
      answerIndex: qData.answerIndex || 0,
      analysis: qData.analysis || '',
      knowledge: qData.knowledge || '',
      segmentId: node.segmentId,
      segmentStart: node.start,
      segmentEnd: node.end,
    });
    setSelectedAnswer(null);
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
  const submitAnswerToServer = async (timeCost) => {
    const question = currentQuestion;
    if (!question || !studyRecordRef.current.videoId) return;
    const answerLetter = question.options[selectedAnswer]?.letter || String.fromCharCode(65 + selectedAnswer);

    try {
      const res = await fetchWithAuth('/api/v1/question/answer', {
        method: 'POST',
        body: {
          video_id: studyRecordRef.current.videoId,
          studentanswers: [{
            question_id: question.id,
            answer: answerLetter,
            time_cost: timeCost,
          }],
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
    if (selectedAnswer === null) { message.info('请先选择答案'); return; }
    const timeCost = Date.now() - questionStartTimeRef.current;
    const correct = selectedAnswer === currentQuestion.answerIndex;

    setShowAnswerResult(true);
    setIsAnswerCorrect(correct);

    const record = studyRecordRef.current;
    if (correct) record.correctAnswers++; else record.wrongAnswers++;

    // 标记已回答
    setAnsweredSegments((prev) => prev.includes(currentQuestion.segmentId) ? prev : [...prev, currentQuestion.segmentId]);

    submitAnswerToServer(timeCost);

    // 自动关闭弹窗并继续播放
    setTimeout(() => {
      setShowQuestionPopup(false);
      setSelectedAnswer(null);
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
    setShowAnswerResult(false);
    setShowQuestionPopup(true);
  };

  const cancelInteraction = () => {
    if (currentQuestion?.segmentId) {
      setAnsweredSegments((prev) => prev.includes(currentQuestion.segmentId) ? prev : [...prev, currentQuestion.segmentId]);
    }
    setShowInteractionConfirm(false);
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
    <div className="video-play-container">
      {/* 导航栏 */}
      <div className="video-nav-bar">
        <div className="video-nav-back" onClick={goBack}>←</div>
        <div className="video-nav-title">{videoTitle}</div>
        <div className="video-nav-right" />
      </div>

      {/* 视频区域 */}
      <div className="video-section-v1" onClick={togglePlay}>
        {isLoading && (
          <div className="video-placeholder-v1">
            <div className="video-spinner-v1" />
            <div className="video-loading-text-v1">正在加载视频...</div>
          </div>
        )}
        {!isLoading && videoError && (
          <div className="video-placeholder-v1">
            <div style={{ color: '#f87171', fontSize: 40, marginBottom: 12 }}>⚠</div>
            <div style={{ color: '#fff', fontSize: 14, padding: '0 20px', textAlign: 'center' }}>{videoError}</div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => loadVideoData()}>点击重试</div>
          </div>
        )}
        <video
          ref={videoRef}
          className="video-player-v1"
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
          <div className="video-cover-v1" onClick={(e) => { e.stopPropagation(); videoRef.current?.play(); }}>
            <div className="play-btn-large-v1">▶</div>
          </div>
        )}
      </div>

      {/* 进度条控制区域 */}
      <div className="progress-control-bar-v1">
        <div className="progress-row-v1">
          <span className="time-info-v1">{formatTime(currentTime / 1000)}</span>
          <div className="progress-track-wrapper-v1" onClick={tapProgressBar}>
            <div className="progress-fill-v1" style={{ width: `${progressPercent}%` }} />
            {interactionNodes.map((node, i) => (
              <div
                key={i}
                className={`progress-node-v1 ${triggeredNodes.includes(node.id) ? 'triggered' : ''} ${answeredSegments.includes(node.segmentId) ? 'answered' : ''}`}
                style={{ left: `${node.progressPercent}%` }}
                title={formatTime(node.time)}
              />
            ))}
            <div className="progress-thumb-v1" style={{ left: `${progressPercent}%` }} />
          </div>
          <span className="time-info-v1">{formatTime(videoDuration / 1000)}</span>
        </div>
        <div className="control-row-v1">
          <div className="control-left-v1">
            <div className="control-btn-v1 play-pause-btn-v1" onClick={togglePlay}>
              <span>{isPlaying ? '❚❚' : '▶'}</span>
            </div>
          </div>
          <div className="control-right-v1">
            <div className="control-btn-v1 speed-btn-v1" onClick={() => setShowSpeedOptions(!showSpeedOptions)}>
              <span>{playbackSpeed}</span>
            </div>
            <div
              className={`control-btn-v1 interaction-toggle-v1 ${enableInteraction ? 'active' : ''}`}
              onClick={toggleInteraction}
            >
              <span>弹</span>
            </div>
            <div className="ai-float-btn-v1" onClick={openAI}>
              <span>🤖</span>
            </div>
          </div>
        </div>
      </div>

      {/* 速度选择面板 */}
      {showSpeedOptions && (
        <div className="speed-selector-v1">
          <div className="speed-list-v1">
            {['0.5×', '0.75×', '1.0×', '1.25×', '1.5×', '2.0×'].map((s) => (
              <div key={s} className={`speed-item-v1 ${playbackSpeed === s ? 'active' : ''}`} onClick={() => selectSpeed(s)}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* 互动答题弹窗 */}
      {showQuestionPopup && currentQuestion && (
        <div className="quiz-popup-overlay-v1" onClick={closeQuestionPopup}>
          <div className="quiz-popup-box-v1" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-popup-header-v1">
              <span className="quiz-popup-title-v1">互动答题</span>
              <span className="quiz-close-btn-v1" onClick={closeQuestionPopup}>✕</span>
            </div>
            <div className="quiz-question-v1">{currentQuestion.title}</div>
            <div className="quiz-options-v1">
              {(currentQuestion.options || []).map((opt, i) => {
                let cls = 'quiz-option-v1';
                if (selectedAnswer === i) cls += ' selected';
                if (showAnswerResult && i === currentQuestion.answerIndex) cls += ' correct';
                if (showAnswerResult && selectedAnswer === i && i !== currentQuestion.answerIndex) cls += ' wrong';
                return (
                  <div
                    key={i}
                    className={cls}
                    onClick={() => { if (!showAnswerResult) setSelectedAnswer(i); }}
                  >
                    <div className="quiz-option-letter-v1">{opt.letter}</div>
                    <span className="quiz-option-text-v1">{opt.text}</span>
                  </div>
                );
              })}
            </div>
            {showAnswerResult && (
              <div className="quiz-result-v1">
                <div className={`result-message-v1 ${isAnswerCorrect ? 'success' : 'error'}`}>
                  {isAnswerCorrect ? '✓ 回答正确！' : `✗ 回答错误，正确答案是 ${currentQuestion.options[currentQuestion.answerIndex]?.letter || ''}`}
                </div>
                {!isAnswerCorrect && (serverAnalysis || currentQuestion.analysis) && (
                  <div className="quiz-analysis-v1">{serverAnalysis || currentQuestion.analysis}</div>
                )}
              </div>
            )}
            <div className="quiz-actions-v1">
              <div
                className={`quiz-submit-btn-v1 ${selectedAnswer !== null && !showAnswerResult ? 'active' : 'disabled'}`}
                onClick={submitPopupAnswer}
              >
                {showAnswerResult ? '已完成' : '提交答案'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 互动确认弹窗 */}
      {showInteractionConfirm && (
        <div className="popup-overlay-v1" onClick={cancelInteraction}>
          <div className="popup-box-v1" onClick={(e) => e.stopPropagation()}>
            <div className="popup-title-v1">是否进行互动?</div>
            <div className="popup-desc-v1">视频将在互动点暂停，请回答问题</div>
            <div className="popup-buttons-v1">
              <div className="popup-btn-v1 cancel" onClick={cancelInteraction}>取消</div>
              <div className="popup-btn-v1 confirm" onClick={confirmInteraction}>确认</div>
            </div>
          </div>
        </div>
      )}

      {/* 视频完成遮罩层 */}
      {showCompletion && (
        <div className="completion-overlay-v1">
          <div className="completion-box-v1">
            <div className="completion-icon-v1">✓</div>
            <div className="completion-title-v1">视频已播放完成</div>
            <div className="completion-desc-v1">恭喜您完成了本次视频学习</div>
            <div className="completion-stats-v1">
              <div className="completion-stat-item-v1">
                <span className="completion-stat-value-v1">{completionRate}%</span>
                <span className="completion-stat-label-v1">完成度</span>
              </div>
              <div className="completion-stat-item-v1">
                <span className="completion-stat-value-v1">{totalQuestions}</span>
                <span className="completion-stat-label-v1">答题数</span>
              </div>
              <div className="completion-stat-item-v1">
                <span className="completion-stat-value-v1">{correctAnswers}</span>
                <span className="completion-stat-label-v1">正确数</span>
              </div>
            </div>
            <div className="completion-actions-v1">
              <div className="completion-btn-v1 replay" onClick={replayVideo}>重新播放</div>
              <div className="completion-btn-v1 analysis" onClick={() => navigate(`/student/report?videoId=${videoId}&title=${encodeURIComponent(videoTitle)}`)}>查看学情分析</div>
              <div className="completion-btn-v1 quiz" onClick={() => navigate(`/student/practice?videoId=${videoId}&title=${encodeURIComponent(videoTitle)}`)}>个性练习</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentVideoLearning;
