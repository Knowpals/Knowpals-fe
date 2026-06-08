import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, Select, Input, Button, message, Tag, Card,
  Typography, Space, Alert, Drawer, Spin, Checkbox
} from 'antd';
import { PlusOutlined, RobotOutlined, UploadOutlined, NodeIndexOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/TeacherLayout';
import { getVideoDetail, generateQuestions, getMyCreatedClasses, publishVideo, agentQuiz, getMyUploadedVideos, addQuestion, updateQuestion, deleteQuestion } from '../../services/teacherApi';
import {
  QUESTION_TYPE, QUESTION_TYPE_META, OPTION_LETTERS,
  normalizeQuestionType, getQuestionTypeLabel, formatOptions,
  normalizeQuestionData,
} from '../../constants/questionTypes';

const { TextArea } = Input;
const { Text } = Typography;

const VideoDetailEdit = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const videoRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [questionType, setQuestionType] = useState(QUESTION_TYPE.SINGLE_CHOICE);

  // 多选题答案（数组）
  const [multiAnswer, setMultiAnswer] = useState([]);
  const [quizCount, setQuizCount] = useState(5);

  // 互动点相关
  const [pointList, setPointList] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null);

  // 视频播放相关
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 班级列表
  const [classList, setClassList] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    insertTime: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    analysis: ''
  });

  // 验证 videoId 是否有效
  const isValidVideoId = videoId && videoId !== 'undefined' && videoId !== 'null' && !isNaN(parseInt(videoId));

  useEffect(() => {
    if (isValidVideoId) {
      fetchVideoDetail();
    } else {
      message.error('视频ID无效');
      setLoading(false);
    }
  }, [videoId]);

  // 当编辑弹窗打开且currentPoint有值时，同步formData
  useEffect(() => {
    if (editModalOpen && currentPoint) {
      // 使用共享常量标准化题型
      const normalized = normalizeQuestionData(currentPoint);
      setQuestionType(normalized.type);

      // 处理选项
      let options = currentPoint.options || currentPoint.choices || [];
      if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch { options = options.split(',').map(opt => opt.trim()); }
      }
      const meta = QUESTION_TYPE_META[normalized.type];
      const optCount = meta.hasOptions ? Math.max(meta.defaultOptionCount, options.length) : 0;
      while (options.length < optCount) options.push('');

      // 多选题答案同步
      if (normalized.type === QUESTION_TYPE.MULTIPLE_CHOICE) {
        const ans = currentPoint.answer || currentPoint.correctAnswer || '';
        if (Array.isArray(ans)) {
          setMultiAnswer(ans);
        } else if (typeof ans === 'string' && ans.includes(',')) {
          setMultiAnswer(ans.split(',').map(s => s.trim()));
        } else if (typeof ans === 'string') {
          setMultiAnswer(ans ? [ans] : []);
        }
      }

      // 填充表单
      setFormData({
        title: normalized.content,
        insertTime: String(currentPoint.time || currentPoint.insert_time || currentPoint.insertTime || currentPoint.timestamp || ''),
        options: options.slice(0, meta.hasOptions ? Math.max(meta.defaultOptionCount, 8) : 0),
        correctAnswer: currentPoint.answer || currentPoint.correctAnswer || currentPoint.right_answer || currentPoint.answer_key || '',
        analysis: currentPoint.analysis || currentPoint.explanation || ''
      });
    }
  }, [editModalOpen, currentPoint]);


  // 题目类型中文映射（使用共享常量）
  const localGetQTypeLabel = (type) => localGetQTypeLabel(type);
  const localGetQTypeColor = (type) => QUESTION_TYPE_META[normalizeQuestionType(type)]?.color || '#666';
  const localGetQTypeBg = (type) => QUESTION_TYPE_META[normalizeQuestionType(type)]?.bg || '#f5f5f5';
  
  const fetchVideoDetail = async () => {
    setLoading(true);
    try {
      const [detailRes, videosRes] = await Promise.all([
        getVideoDetail(videoId),
        getMyUploadedVideos(),
      ]);
      const detailData = detailRes.data;

      // getVideoDetail 不返回 status，从上传列表中匹配
      const videoList = videosRes.data?.videos || [];
      const targetId = parseInt(videoId);
      const matchedVideo = videoList.find(
        (v) => (v.video_id || v.id) === targetId
      );
      // 兼容空字符串：只有明确的值才使用，否则 fallback
      const rawStatus = matchedVideo?.status;
      detailData.status = (rawStatus && rawStatus !== '') ? rawStatus : 'pending';

      console.log('状态匹配: videoId=%d, matched=%o, rawStatus=%s, final=%s',
        targetId, matchedVideo, rawStatus, detailData.status);
      setVideoData(detailData);

      // 从 getVideoDetail 提取题目（segments + top-level questions）
      const segments = detailData?.segments || [];
      let questions = [];
      if (segments.length > 0) {
        questions = segments
          .filter(seg => seg.question && Object.keys(seg.question).length > 0)
          .map(seg => ({
            ...seg.question,
            id: seg.question.id,
            title: seg.question.content || seg.question.title || '',
            content: seg.question.content || seg.question.title || '',
            typeLabel: localGetQTypeLabel(seg.question.type),
            time: seg.start ? seg.start / 1000 : 0,
            segment_id: seg.id,
          }));
      }
      if (questions.length === 0) {
        const topQuestions = detailData?.questions || [];
        questions = topQuestions.map(q => ({
          ...q,
          id: q.id,
          title: q.content || q.title || '',
          typeLabel: localGetQTypeLabel(q.type),
          time: 0,
          segment_id: q.segment_id || 0,
        }));
      }

      console.log('题目列表:', questions);
      setPointList(questions);
    } catch (error) {
      console.error('获取视频详情失败:', error);
      message.error(error.message || '获取视频详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取班级列表
  const fetchClassList = async () => {
    try {
      const res = await getMyCreatedClasses();
      setClassList(res.data?.class_list || []);
    } catch (error) {
      console.error('获取班级列表失败', error);
    }
  };

  // 保存当前状态引用，避免后台刷新用空值覆盖乐观更新
  const statusRef = useRef(videoData?.status);

  // 刷新视频状态（后端未返回有效状态时，保留当前前端状态不覆盖）
  const refreshVideoStatus = async () => {
    try {
      const [detailRes, videosRes] = await Promise.all([
        getVideoDetail(videoId),
        getMyUploadedVideos(),
      ]);
      const updatedData = detailRes.data;
      const videoList = videosRes.data?.videos || [];
      const matched = videoList.find(
        (v) => (v.video_id || v.id) === parseInt(videoId)
      );
      const rawStatus = matched?.status;

      // 只在后端返回了有效状态时才更新；否则保留当前状态
      if (rawStatus && rawStatus !== '') {
        updatedData.status = rawStatus;
      }
      // 否则 updatedData.status 保持 undefined，setVideoData 时不会覆盖已有 status

      setVideoData(prev => {
        const newStatus = (rawStatus && rawStatus !== '') ? rawStatus : prev.status;
        statusRef.current = newStatus;
        return { ...updatedData, status: newStatus };
      });
    } catch {
      // 静默失败，不影响当前页面状态
    }
  };

  // 打开「下发到班级」弹窗
  const handleOpenAssignClass = () => {
    if (!isValidVideoId) {
      message.error('视频ID无效');
      return;
    }
    fetchClassList();
    setIsPublishModalOpen(true);
  };

  // 视频时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 视频加载完成
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // 跳转到指定时间
  const seekTo = (time) => {
    if (videoRef.current && time && isFinite(time)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 打开编辑互动点弹窗
  const handleOpenEditPoint = (item) => {
    setCurrentPoint(item);
    setEditModalOpen(true);
  };

  // AI生成互动点（优先使用新版 agent/quiz，支持指定数量）
  const handleAIGenerate = async () => {
    if (!isValidVideoId) {
      message.error('视频ID无效，无法生成互动点');
      return;
    }
    setIsGenerating(true);
    message.loading({ content: `正在生成 ${quizCount} 道互动点...`, key: 'ai-generate', duration: 0 });
    try {
      let questions = [];

      // 优先用新版 agent/quiz API
      try {
        const res = await agentQuiz({ num_questions: quizCount, video_id: String(videoId) });
        questions = res.data?.quizzes || [];
        // 新版 API 返回 question 字段，映射为 content/title
        questions = questions.map((q) => ({
          ...q,
          content: q.question || q.content,
          title: q.question || q.content || '',
          typeLabel: localGetQTypeLabel(q.type),
          time: 0,
        }));
      } catch {
        // 新版 API 失败，回退到旧版 generateQuestions
        console.log('新版 agent/quiz 失败，回退到旧版 question/generate');
        const res = await generateQuestions(videoId);
        let raw = res.data?.questions || res.data?.data?.questions || res.data?.question_list || res.data?.interactions || res.data?.items || [];
        if (!Array.isArray(raw) && typeof raw === 'object') {
          raw = Object.values(raw);
        }
        questions = raw;
      }

      if (questions.length === 0) {
        message.warning({ content: '未能生成互动点，请稍后重试', key: 'ai-generate', duration: 2 });
        return;
      }

      const allPoints = [...pointList, ...questions.map((q) => ({
        ...q,
        title: q.title || q.content || q.question || q.question_title || '',
        typeLabel: q.typeLabel || localGetQTypeLabel(q.type || q.question_type),
        time: q.time || q.insert_time || q.insertTime || 0,
      }))];

      setPointList(allPoints);
      message.success({ content: `成功生成 ${questions.length} 个互动点！`, key: 'ai-generate', duration: 2 });
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.response?.data?.message || error.message || '生成失败，请重试';
      message.error({ content: errorMsg, key: 'ai-generate', duration: 2 });
    } finally {
      setIsGenerating(false);
    }
  };

  // 新增互动点提交（调用后端接口）
  const handleAddQuestion = async () => {
    const meta = QUESTION_TYPE_META[questionType];

    // 选择题需校验选项
    if (meta.hasOptions && formData.options.filter(o => o).length < 2) {
      message.warning('请至少输入 2 个选项');
      return;
    }
    // 多选题需校验多选答案
    if (questionType === QUESTION_TYPE.MULTIPLE_CHOICE && multiAnswer.length === 0) {
      message.warning('请至少选择一个正确答案');
      return;
    }
    if (!formData.title || !formData.insertTime) {
      message.warning('请填写题目内容和插入时间点');
      return;
    }
    if (questionType !== QUESTION_TYPE.MULTIPLE_CHOICE && !formData.correctAnswer) {
      message.warning('请填写正确答案');
      return;
    }

    try {
      // 构建答案：多选题用数组，其他用字符串
      const answer = questionType === QUESTION_TYPE.MULTIPLE_CHOICE
        ? multiAnswer
        : formData.correctAnswer;

      const apiData = {
        video_id: parseInt(videoId),
        content: formData.title,
        type: meta.apiType,
        answer: answer,
        time_ms: (parseInt(formData.insertTime) || 0) * 1000,
        analysis: formData.analysis,
        options: meta.hasOptions ? formData.options.filter(o => o) : undefined,
      };
      await addQuestion(apiData);
      message.success('互动点添加成功');
      setIsAddModalOpen(false);
      setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
      setMultiAnswer([]);
      // 刷新题目列表
      const refreshRes = await getVideoDetail(videoId);
      const rd = refreshRes.data;
      const segs = rd?.segments || [];
      let freshQ = segs
        .filter(s => s.question && Object.keys(s.question).length > 0)
        .map(s => ({ ...s.question, id: s.question.id, title: s.question.content || s.question.title || '', typeLabel: localGetQTypeLabel(s.question.type), time: s.start ? s.start / 1000 : 0, segment_id: s.id }));
      if (freshQ.length === 0) {
        freshQ = (rd?.questions || []).map(q => ({ ...q, id: q.id, title: q.content || q.title || '', typeLabel: localGetQTypeLabel(q.type), time: 0, segment_id: q.segment_id || 0 }));
      }
      setPointList(freshQ);
    } catch (error) {
      message.error(error.message || '添加失败');
    }
  };

  // 发布到班级（review/publish 一步完成：发布 + 创建班级任务）
  const handlePublishToClass = async () => {
    if (selectedClassIds.length === 0) {
      message.warning('请选择班级');
      return;
    }
    if (!isValidVideoId) {
      message.error('视频ID无效');
      return;
    }

    setPublishing(true);
    try {
      await publishVideo({
        video_id: parseInt(videoId),
        class_ids: selectedClassIds.map(id => parseInt(id))
      });

      // 发布成功后直接更新前端状态，不等待后端轮询
      setVideoData(prev => ({ ...prev, status: 'published' }));

      message.success(`已发布到 ${selectedClassIds.length} 个班级！`);
      setIsPublishModalOpen(false);
      refreshVideoStatus(); // 后台静默刷新，不阻塞
      Modal.confirm({
        title: '发布成功',
        content: '是否前往班级详情页查看？',
        onOk: () => navigate(`/class-detail/${selectedClassIds[0]}`),
        okText: '前往查看',
        cancelText: '稍后查看',
      });
    } catch (error) {
      message.error(error.message || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  // 追加下发到更多班级（复用 review/publish）
  const handleAssignMore = async () => {
    if (selectedClassIds.length === 0) {
      message.warning('请选择班级');
      return;
    }
    if (!isValidVideoId) {
      message.error('视频ID无效');
      return;
    }

    setPublishing(true);
    try {
      await publishVideo({
        video_id: parseInt(videoId),
        class_ids: selectedClassIds.map(id => parseInt(id))
      });

      message.success(`已追加下发到 ${selectedClassIds.length} 个班级！`);
      setIsPublishModalOpen(false);
      Modal.confirm({
        title: '下发成功',
        content: '是否前往班级详情页查看？',
        onOk: () => navigate(`/class-detail/${selectedClassIds[0]}`),
        okText: '前往查看',
        cancelText: '稍后查看',
      });
    } catch (error) {
      message.error(error.message || '下发失败');
    } finally {
      setPublishing(false);
    }
  };

  // 删除互动点（调用后端接口）
  const handleDeletePoint = async (pointId) => {
    try {
      await deleteQuestion(pointId);
      setPointList(pointList.filter(p => p.id !== pointId));
      setEditModalOpen(false);
      message.success('删除成功');
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  // 获取状态显示
  const getStatusDisplay = () => {
    const status = videoData?.status || 'pending';
    const statusMap = {
      pending: { text: '待发布', color: '#fa8c16', bg: '#fff7e6' },
      reviewing: { text: '审核中', color: '#1890ff', bg: '#e6f7ff' },
      published: { text: '已发布', color: '#52c41a', bg: '#f6ffed' },
    };
    return statusMap[status] || statusMap.pending;
  };

  // 判断 AI 处理状态
  const getAIStatus = () => {
    const hasSegments = videoData?.segments?.length > 0;
    const hasKnowledge = videoData?.knowledge?.length > 0;
    const hasQuestions = pointList.length > 0;

    if (!videoData?.url) {
      return { level: 'none', text: '未上传', tip: '视频文件尚未上传', color: '#d9d9d9' };
    }
    if (!hasSegments && !hasKnowledge && !hasQuestions) {
      return { level: 'processing', text: 'AI 处理中', tip: '视频正在 AI 分析，暂不可用 AI 对话', color: '#faad14' };
    }
    if (hasSegments && !hasQuestions) {
      return { level: 'ready', text: 'AI 已分析', tip: '知识点已提取，可添加互动点后发布', color: '#1890ff' };
    }
    return { level: 'complete', text: 'AI 已完成', tip: '视频分析及互动点已就绪，可使用 AI 对话', color: '#52c41a' };
  };

  // 格式化时间
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // 进度百分比
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <MainLayout pageTitle="视频编辑" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  const status = getStatusDisplay();
  const aiStatus = getAIStatus();

  return (
    <MainLayout pageTitle={videoData?.title || '视频编辑'} showBack>
      {/* 状态标签 + 操作按钮 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tag color={status.color === '#52c41a' ? 'success' : status.color === '#1890ff' ? 'processing' : 'warning'}>
          {status.text}
        </Tag>
        <Tag color={aiStatus.level === 'complete' ? 'success' : aiStatus.level === 'processing' ? 'warning' : aiStatus.level === 'ready' ? 'processing' : 'default'}>
          {aiStatus.text}
        </Tag>
        <Text style={{ color: '#999', fontSize: 12 }}>{aiStatus.tip}</Text>
        <Text style={{ color: '#666', fontSize: 12, marginLeft: 8 }}>
          互动点: {pointList.length} | 知识点: {videoData?.knowledge?.length || 0} | 分段: {videoData?.segments?.length || 0}
        </Text>
        {aiStatus.level === 'processing' && (
          <Button size="small" onClick={fetchVideoDetail} loading={loading}>
            刷新状态
          </Button>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {(videoData?.status === 'pending' || videoData?.status === 'reviewing' || !videoData?.status) && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
              onClick={handleOpenAssignClass}
            >
              发布到班级
            </Button>
          )}
          {videoData?.status === 'published' && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
              onClick={handleOpenAssignClass}
            >
              追加下发
            </Button>
          )}
        </div>
      </div>

      {/* AI 处理状态提示 */}
      {aiStatus.level === 'processing' && (
        <Alert
          title="视频正在 AI 分析中"
          description="AI 正在对视频进行分段、提取知识点。处理完成前无法使用 AI 对话和生成互动点。点击右上角「刷新状态」按钮手动检查。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {aiStatus.level === 'ready' && (
        <Alert
          title="AI 分析已完成，可添加互动点"
          description="知识点已提取，建议点击「AI 生成互动点」自动生成题目，或手动添加互动点后发布。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 视频知识图谱 */}
      {videoData?.subgraph && (() => {
        try {
          const sg = typeof videoData.subgraph === 'string'
            ? JSON.parse(videoData.subgraph)
            : videoData.subgraph;
          const gn = sg.nodes || sg.entities || [];
          const ge = sg.edges || sg.relations || [];

          // 节点类型颜色
          const typeColors = ['#722ed1', '#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#13c2c2', '#faad14', '#2f54eb', '#a0d911', '#f5222d'];
          const categories = [...new Set(gn.map(n => n.type || n.category || '知识点'))].map((t, i) => ({
            name: t, itemStyle: { color: typeColors[i % typeColors.length] },
          }));

          const option = {
            tooltip: {
              formatter: (p) => {
                if (p.dataType === 'node') {
                  const n = gn.find(x => (x.id || x.label) === p.name);
                  return `<b>${p.name}</b><br/>类型: ${n?.type || n?.category || '知识点'}<br/>${n?.description || n?.desc || ''}`;
                }
                return `${p.data.source} → ${p.data.target}`;
              },
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderColor: '#e8e8e8',
              textStyle: { color: '#333' },
              extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
            },
            legend: gn.length < 30 ? { bottom: 0, data: categories.map(c => c.name) } : undefined,
            series: [{
              type: 'graph',
              layout: 'force',
              roam: true,
              draggable: true,
              categories,
              nodes: gn.map((n, i) => ({
                id: n.id || n.label,
                name: n.label || n.name,
                category: n.type || n.category || '知识点',
                symbolSize: n.type === 'core' || n.type === 'Topic' ? 28 : n.type === 'Module' ? 22 : 18,
                label: { show: true, fontSize: 10, color: '#444', position: 'right', distance: 4 },
                itemStyle: {
                  borderWidth: 2,
                  borderColor: '#fff',
                  shadowBlur: 6,
                  shadowColor: 'rgba(0,0,0,0.08)',
                },
              })),
              edges: ge.map(e => ({
                source: e.from || e.source,
                target: e.to || e.target,
                label: e.relation ? { show: true, fontSize: 9, formatter: e.relation } : undefined,
                lineStyle: {
                  color: e.relation === 'prerequisite' || e.relation === 'strong_prerequisite' ? '#ff4d4f'
                    : e.relation === 'weak_prerequisite' ? '#faad14'
                    : '#c0c0c0',
                  width: e.relation === 'prerequisite' || e.relation === 'strong_prerequisite' ? 2 : 1,
                  curveness: 0.2,
                  opacity: 0.6,
                },
              })),
              force: { repulsion: 400, gravity: 0.08, edgeLength: [100, 280], friction: 0.6 },
              emphasis: {
                focus: 'adjacency',
                lineStyle: { width: 3, opacity: 1 },
                itemStyle: { shadowBlur: 20, shadowColor: 'rgba(114,46,209,0.4)' },
                label: { fontSize: 14, fontWeight: 'bold' },
              },
              scaleLimit: { min: 0.4, max: 4 },
            }],
          };

          return (
            <Card
              title={
                <Space>
                  <NodeIndexOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                  <span>视频知识图谱</span>
                  <Tag color="purple" style={{ marginLeft: 8 }}>{gn.length} 节点</Tag>
                  <Tag color="blue">{ge.length} 关系</Tag>
                </Space>
              }
              style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ height: 400, background: 'linear-gradient(135deg, #f5f3ff 0%, #e8f4f8 100%)', borderRadius: '0 0 12px 12px' }}>
                <ReactECharts option={option} style={{ height: 400 }} notMerge />
              </div>
            </Card>
          );
        } catch {
          return null;
        }
      })()}

      {/* 视频播放器 + 进度条互动点 */}
      <div style={{
        width: '100%',
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        position: 'relative'
      }}>
        {videoData?.url ? (
          <video
            ref={videoRef}
            src={videoData.url}
            style={{ width: '100%', height: 400, objectFit: 'contain', borderRadius: 8 }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: 400, 
            background: '#333', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            暂无视频内容
          </div>
        )}

        {/* 自定义进度条 + 互动点标记 */}
        <div style={{ marginTop: 16 }}>
          <div style={{
            width: '100%',
            height: 8,
            background: '#444',
            borderRadius: 4,
            position: 'relative',
            cursor: 'pointer'
          }}>
            {/* 已播放进度 */}
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: '#722ed1',
              borderRadius: 4
            }} />
            
            {/* 互动点标记 */}
            {pointList.map((point, idx) => {
              const title = point.title ?? point.question_title ?? point.questionTitle ?? point.content ?? '互动点';
              const normPtType = normalizeQuestionType(point.type ?? point.question_type ?? point.questionType ?? '');
              const ptMeta = QUESTION_TYPE_META[normPtType];
              const type = point.typeLabel || ptMeta.label;
              const timeValue = parseFloat(point.time ?? point.insert_time ?? point.insertTime ?? 0) || 0;
              const percent = duration > 0 && timeValue > 0 ? (timeValue / duration) * 100 : 0;
              return (
                <div
                  key={point.id ?? point.question_id ?? idx}
                  style={{
                    position: 'absolute',
                    left: `${percent}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: ptMeta?.color || '#722ed1',
                    border: '3px solid white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 10
                  }}
                  title={`${title} (${type}) - ${timeValue}秒`}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(timeValue);
                  }}
                />
              );
            })}
          </div>
          
          {/* 时间显示 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginTop: 8, fontSize: 12 }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <Space size="middle" style={{ marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
          添加互动点
        </Button>
        <Space.Compact>
          <Select
            value={quizCount}
            onChange={setQuizCount}
            style={{ width: 70 }}
            options={[3, 5, 8, 10].map((n) => ({ value: n, label: `${n}题` }))}
          />
          <Button icon={<RobotOutlined />} onClick={handleAIGenerate} loading={isGenerating}>
            AI生成互动点
          </Button>
        </Space.Compact>
        <Button onClick={() => setDrawerOpen(true)}>
          查看互动点 ({pointList.length})
        </Button>
      </Space>

      {/* 无互动点提示 */}
      {pointList.length === 0 && videoData?.url && (
        <Alert
          title="互动点还未添加"
          description="建议添加互动点，让学生更好地学习"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 新增互动点弹窗 */}
      <Modal
        title="添加互动点"
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
          setMultiAnswer([]);
        }}
        footer={null}
        width={560}
      >
        {/* 题目类型选择 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>题目类型：</Text>
          <Select
            value={questionType}
            onChange={(val) => {
              setQuestionType(val);
              setFormData(prev => ({ ...prev, correctAnswer: '' }));
              setMultiAnswer([]);
              // 判断题自动补默认选项
              if (val === QUESTION_TYPE.TRUE_FALSE) {
                setFormData(prev => ({ ...prev, options: ['对', '错'] }));
              }
            }}
            style={{ width: '100%', marginTop: 8 }}
          >
            {Object.entries(QUESTION_TYPE_META).map(([key, meta]) => (
              <Select.Option key={key} value={key}>
                <span>{meta.icon} {meta.label}</span>
                <span style={{ color: '#999', fontSize: 11, marginLeft: 8 }}>{meta.answerHint}</span>
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 题目内容 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>题目标题：</Text>
          <Input
            placeholder="请输入题目"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        {/* 插入时间点 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>插入时间点（秒）：</Text>
          <Input
            type="number"
            placeholder={`视频时长${duration > 0 ? formatTime(duration) : '0:00'}内`}
            value={formData.insertTime}
            onChange={(e) => setFormData({ ...formData, insertTime: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        {/* --- 选择题选项区 --- */}
        {(questionType === QUESTION_TYPE.SINGLE_CHOICE || questionType === QUESTION_TYPE.MULTIPLE_CHOICE) && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>选项（{questionType === QUESTION_TYPE.MULTIPLE_CHOICE ? '可多选正确答案' : '单选'}）：</Text>
            {formData.options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#f0f0f0', color: '#666',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}>
                  {OPTION_LETTERS[idx]}
                </span>
                <Input
                  placeholder={`选项 ${OPTION_LETTERS[idx]}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[idx] = e.target.value;
                    setFormData({ ...formData, options: newOptions });
                  }}
                  style={{ flex: 1 }}
                />
              </div>
            ))}
            <Button
              type="dashed" size="small"
              style={{ marginTop: 8 }}
              onClick={() => setFormData(prev => ({ ...prev, options: [...prev.options, ''] }))}
            >
              + 添加选项
            </Button>

            {/* 正确答案 */}
            <div style={{ marginTop: 16 }}>
              <Text strong>{QUESTION_TYPE_META[questionType].answerLabel}：</Text>
              {questionType === QUESTION_TYPE.SINGLE_CHOICE ? (
                <Select
                  placeholder="选择正确选项"
                  value={formData.correctAnswer || undefined}
                  onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {formData.options.map((opt, idx) =>
                    opt ? <Select.Option key={OPTION_LETTERS[idx]} value={OPTION_LETTERS[idx]}>{OPTION_LETTERS[idx]}. {opt}</Select.Option> : null
                  )}
                </Select>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <Checkbox.Group
                    value={multiAnswer}
                    onChange={setMultiAnswer}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    {formData.options.map((opt, idx) =>
                      opt ? (
                        <Checkbox key={OPTION_LETTERS[idx]} value={OPTION_LETTERS[idx]}>
                          {OPTION_LETTERS[idx]}. {opt}
                        </Checkbox>
                      ) : null
                    )}
                  </Checkbox.Group>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 判断题答案区 --- */}
        {questionType === QUESTION_TYPE.TRUE_FALSE && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>{QUESTION_TYPE_META[questionType].answerLabel}：</Text>
            <Select
              placeholder="选择对或错"
              value={formData.correctAnswer || undefined}
              onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="对">对 (True)</Select.Option>
              <Select.Option value="错">错 (False)</Select.Option>
            </Select>
          </div>
        )}

        {/* --- 填空/简答答案区 --- */}
        {(questionType === QUESTION_TYPE.FILL_BLANK || questionType === QUESTION_TYPE.SHORT_ANSWER) && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>{QUESTION_TYPE_META[questionType].answerLabel}：</Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              {QUESTION_TYPE_META[questionType].answerHint}
            </Text>
            <TextArea
              placeholder={questionType === QUESTION_TYPE.FILL_BLANK ? '多个填空答案用 | 分隔，如：泰勒|Newton|迭代' : '输入参考答案或评分要点'}
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        {/* 答案解析 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>答案解析：</Text>
          <TextArea
            placeholder="请输入答案解析"
            value={formData.analysis}
            onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
            rows={3}
            style={{ marginTop: 8 }}
          />
        </div>

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => {
            setIsAddModalOpen(false);
            setMultiAnswer([]);
          }}>取消</Button>
          <Button type="primary" onClick={handleAddQuestion} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            确认添加
          </Button>
        </Space>
      </Modal>

      {/* 发布到班级弹窗 */}
      <Modal
        title={videoData?.status === 'published' ? '追加下发到班级' : '发布视频到班级'}
        open={isPublishModalOpen}
        onCancel={() => setIsPublishModalOpen(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>选择班级（可多选）：</Text>
          <Select
            mode="multiple"
            placeholder="请选择要发布的班级"
            style={{ width: '100%', marginTop: 8 }}
            value={selectedClassIds}
            onChange={setSelectedClassIds}
          >
            {classList.map(cls => (
              <Option key={cls.class_id} value={cls.class_id}>{cls.class_name}</Option>
            ))}
          </Select>
        </div>
        
        {pointList.length === 0 && (
          <Alert
            message="当前视频暂无互动点"
            description="建议先添加互动点再发布"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setIsPublishModalOpen(false)}>取消</Button>
          <Button
            type="primary"
            onClick={() => {
              const status = videoData?.status || 'pending';
              if (status === 'published') {
                handleAssignMore();
              } else {
                handlePublishToClass();
              }
            }}
            loading={publishing}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            确认发布
          </Button>
        </Space>
      </Modal>

      {/* 互动点列表抽屉 */}
      <Drawer
        title="互动点列表"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => {
            setDrawerOpen(false);
            setIsAddModalOpen(true);
          }}>
            添加
          </Button>
        }
      >
        {pointList.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div style={{ fontSize: 15 }}>暂无互动点</div>
            <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>点击上方"添加互动点"创建</div>
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '0 4px' }}>
            {pointList.map((item, index) => {
              const title = item.title ?? item.content ?? item.question_title ?? item.questionTitle ?? '无标题';
              // 优先使用 typeLabel，否则调用映射函数
              const normType = normalizeQuestionType(item.type ?? item.question_type ?? item.questionType ?? '');
              const typeMeta = QUESTION_TYPE_META[normType];
              const type = item.typeLabel || typeMeta.label;
              const timeValue = item.time ?? item.insert_time ?? item.insertTime ?? 0;
              const id = item.id ?? item.question_id ?? index;
              const answer = item.answer ?? item.correctAnswer ?? item.right_answer ?? '';
              const analysis = item.analysis ?? item.explanation ?? '';
              const options = item.options ?? item.choices ?? [];

              // 使用共享常量的样式
              const typeStyle = {
                bg: typeMeta.bg,
                color: typeMeta.color,
                border: typeMeta.border,
                accent: typeMeta.color,
              };

              // 判断题型
              const isChoice = normType === QUESTION_TYPE.SINGLE_CHOICE || normType === QUESTION_TYPE.MULTIPLE_CHOICE;
              const isJudge = normType === QUESTION_TYPE.TRUE_FALSE;
              const isShortAnswer = normType === QUESTION_TYPE.SHORT_ANSWER;
              const isFillBlank = normType === QUESTION_TYPE.FILL_BLANK;
              
              // 判断答案是否正确（用于选择题高亮）
              const isCorrectOption = (_opt, i) => {
                const correctLetter = answer?.toUpperCase();
                return correctLetter === String.fromCharCode(65 + i) || correctLetter === ['A', 'B', 'C', 'D'][i];
              };
              
              return (
                <div
                  key={id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    border: `2px solid ${typeStyle.border}`,
                    borderRadius: 12,
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* 头部：序号 + 标题 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12, paddingLeft: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${typeStyle.accent} 0%, ${typeStyle.color} 100%)`,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      marginRight: 12,
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 15, color: '#262626', display: 'block', marginBottom: 6 }}>
                        {title}
                      </Text>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          fontWeight: 500
                        }}>
                          {type}
                        </span>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          background: '#f0f0f0',
                          color: '#666'
                        }}>
                          ⏱ {formatTime(timeValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 选择题样式 */}
                  {isChoice && options.length > 0 && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        请选择正确答案
                      </Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {options.map((opt, i) => {
                          const correct = isCorrectOption(opt, i);
                          return (
                            <div key={i} style={{
                              padding: '10px 12px',
                              background: correct ? '#52c41a' : '#fff',
                              borderRadius: 8,
                              fontSize: 13,
                              color: correct ? '#fff' : '#333',
                              border: `2px solid ${correct ? '#52c41a' : '#e8e8e8'}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontWeight: correct ? 600 : 400
                            }}>
                              <span style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: correct ? '#fff' : typeStyle.bg,
                                color: correct ? '#52c41a' : typeStyle.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span style={{ flex: 1 }}>{opt || '未设置'}</span>
                              {correct && <span>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 判断题样式 */}
                  {isJudge && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        请判断正误
                      </Text>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {['对', '错'].map((opt) => {
                          const correct = answer === opt;
                          return (
                            <div key={opt} style={{
                              flex: 1,
                              padding: '12px 16px',
                              background: correct ? '#52c41a' : '#fff',
                              borderRadius: 10,
                              fontSize: 14,
                              color: correct ? '#fff' : '#333',
                              border: `2px solid ${correct ? '#52c41a' : '#e8e8e8'}`,
                              textAlign: 'center',
                              fontWeight: correct ? 700 : 500
                            }}>
                              {opt === '对' ? '✓' : '✗'} {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 简答题样式 */}
                  {isShortAnswer && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        参考答案
                      </Text>
                      <div style={{
                        padding: '12px',
                        background: '#fff',
                        borderRadius: 8,
                        border: '1px solid #e8e8e8',
                        fontSize: 13,
                        color: '#333',
                        minHeight: 40,
                        lineHeight: 1.6
                      }}>
                        {answer || '暂无参考答案'}
                      </div>
                    </div>
                  )}
                  
                  {/* 填空题样式 */}
                  {isFillBlank && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: 12,
                      background: typeStyle.bg,
                      borderRadius: 10,
                      border: `1px dashed ${typeStyle.border}`
                    }}>
                      <Text style={{ fontSize: 12, color: typeStyle.color, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                        填空答案
                      </Text>
                      <div style={{
                        padding: '12px',
                        background: '#fff',
                        borderRadius: 8,
                        border: '2px dashed #ffd591',
                        fontSize: 13,
                        color: '#333',
                        minHeight: 40,
                        lineHeight: 1.6
                      }}>
                        {answer || '暂无答案'}
                      </div>
                    </div>
                  )}
                  
                  {/* 解析 */}
                  {analysis && (
                    <div style={{ 
                      marginBottom: 12, 
                      padding: '10px 12px',
                      background: '#fffbe6',
                      borderRadius: 8,
                      fontSize: 13,
                      borderLeft: '3px solid #faad14'
                    }}>
                      <Text style={{ color: '#fa8c16', fontWeight: 500 }}>💡 解析：</Text>
                      <Text style={{ color: '#666', marginLeft: 4 }}>{analysis}</Text>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 6, 
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <Button 
                      size="small" 
                      onClick={() => {
                        seekTo(timeValue);
                        setDrawerOpen(false);
                      }}
                      style={{ 
                        flex: 1,
                        borderColor: typeStyle.accent,
                        color: typeStyle.accent
                      }}
                    >
                      🎬 跳转
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => handleOpenEditPoint(item)}
                      style={{ 
                        flex: 1,
                        background: typeStyle.accent,
                        borderColor: typeStyle.accent,
                        color: '#fff'
                      }}
                    >
                      ✏️ 编辑
                    </Button>
                    <Button 
                      size="small" 
                      danger 
                      onClick={() => handleDeletePoint(id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Drawer>

      {/* 编辑互动点弹窗 */}
      <Modal
        title="编辑互动点"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>题目类型：</Text>
          <Select
            value={questionType}
            onChange={setQuestionType}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="选择题">选择题</Option>
            <Option value="判断题">判断题</Option>
            <Option value="简答题">简答题</Option>
            <Option value="填空题">填空题</Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>题目标题：</Text>
          <Input
            placeholder="请输入题目"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>插入时间点（秒）：</Text>
          <Input
            type="number"
            placeholder={`视频时长${duration > 0 ? formatTime(duration) : '0:00'}内`}
            value={formData.insertTime}
            onChange={(e) => setFormData({ ...formData, insertTime: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>

        {questionType === '选择题' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>选项：</Text>
            {['A', 'B', 'C', 'D'].map((opt, index) => (
              <Input
                key={opt}
                placeholder={`选项${opt}`}
                value={formData.options[index]}
                onChange={(e) => {
                  const newOptions = [...formData.options];
                  newOptions[index] = e.target.value;
                  setFormData({ ...formData, options: newOptions });
                }}
                style={{ marginTop: 8 }}
              />
            ))}
            <div style={{ marginTop: 16 }}>
              <Text strong>正确答案：</Text>
              <Select
                placeholder="选择正确答案"
                value={formData.correctAnswer || undefined}
                onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
                style={{ width: '100%', marginTop: 8 }}
              >
                {['A', 'B', 'C', 'D'].map(opt => (
                  <Option key={opt} value={opt}>{opt}. {formData.options[['A', 'B', 'C', 'D'].indexOf(opt)] || `选项${opt}`}</Option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {questionType === '判断题' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>正确答案：</Text>
            <Select
              placeholder="选择正确答案"
              value={formData.correctAnswer || undefined}
              onChange={(val) => setFormData({ ...formData, correctAnswer: val })}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="对">对</Option>
              <Option value="错">错</Option>
            </Select>
          </div>
        )}

        {(questionType === '简答题' || questionType === '填空题') && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>参考答案：</Text>
            <TextArea
              placeholder="请输入参考答案"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text strong>答案解析：</Text>
          <TextArea
            placeholder="请输入答案解析"
            value={formData.analysis}
            onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
            rows={3}
            style={{ marginTop: 8 }}
          />
        </div>

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => {
            setEditModalOpen(false);
            setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
          }}>取消</Button>
          <Button type="primary" onClick={async () => {
            if (!formData.title || !formData.insertTime || !formData.correctAnswer) {
              message.warning('请填写完整的互动点信息');
              return;
            }
            try {
              const pointId = currentPoint?.id || currentPoint?.question_id;
              const apiData = {
                questionID: pointId,
                content: formData.title,
                type: questionType === '选择题' ? 'choice'
                  : questionType === '判断题' ? 'judge'
                  : questionType === '填空题' ? 'fill'
                  : 'subjective',
                answer: formData.correctAnswer,
                analysis: formData.analysis,
                options: questionType === '选择题' ? formData.options.filter(o => o) : undefined,
              };
              await updateQuestion(pointId, apiData);
              // 刷新题目列表
              const reviewRes = await getReviewQuestions(videoId);
              const freshQuestions = (reviewRes.data?.questions || []).map(q => ({
                ...q,
                id: q.id,
                title: q.content || q.title || '',
                typeLabel: localGetQTypeLabel(q.type),
                time: 0,
                segment_id: q.segment_id || 0,
              }));
              setPointList(freshQuestions);
              setEditModalOpen(false);
              setFormData({ title: '', insertTime: '', options: ['', '', '', ''], correctAnswer: '', analysis: '' });
              message.success('互动点已更新');
            } catch (error) {
              message.error(error.message || '更新失败');
            }
          }} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
            保存
          </Button>
        </Space>
      </Modal>
    </MainLayout>
  );
};

export default VideoDetailEdit;
