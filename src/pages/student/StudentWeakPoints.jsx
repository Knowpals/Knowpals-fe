import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import request from '../../utils/request';

function formatTime(ms) {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function formatDurationMs(ms) {
  if (!ms) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分${seconds}秒`;
}

// Mock data matching the H5 original
const MOCK_HISTORY = [
  {
    knowledge_id: 'k1',
    title: '勾股定理应用',
    mastery: 45,
    weak_rate: 55,
    description: '在实际问题中应用勾股定理解题困难',
    weakness: ['复杂图形分析', '多步骤计算'],
    behavior_pattern: ['频繁暂停', '重复观看'],
    relatedVideos: [
      { video_id: 101, title: '勾股定理应用技巧', duration: '8:30' },
      { video_id: 102, title: '勾股定理经典例题', duration: '12:15' },
    ],
  },
  {
    knowledge_id: 'k2',
    title: '二次函数顶点',
    mastery: 52,
    weak_rate: 48,
    description: '顶点坐标计算容易出错',
    weakness: ['公式记错', '符号处理'],
    behavior_pattern: ['回看视频'],
    relatedVideos: [
      { video_id: 201, title: '二次函数顶点精讲', duration: '10:00' },
    ],
  },
  {
    knowledge_id: 'k3',
    title: '因式分解技巧',
    mastery: 38,
    weak_rate: 62,
    description: '复杂的因式分解方法掌握不牢',
    weakness: ['十字相乘法', '分组分解法'],
    behavior_pattern: ['答题正确率低'],
    relatedVideos: [],
  },
];

export default function StudentWeakPoints() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [historyWeakPoints, setHistoryWeakPoints] = useState([]);
  const [currentWeakPoints, setCurrentWeakPoints] = useState([]);
  const [weakPoints, setWeakPoints] = useState([]);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('加载中...');

  useEffect(() => {
    const knowledgeIds = searchParams.get('knowledgeIds');
    const ids = knowledgeIds ? knowledgeIds.split(',') : [];

    // Load mock history data (matching H5 original)
    const history = MOCK_HISTORY;
    setHistoryWeakPoints(history);

    let current = history.filter(p => ids.includes(p.knowledge_id));
    if (current.length === 0 && ids.length > 0) {
      current = ids.map((id, index) => ({
        knowledge_id: id,
        title: `薄弱知识点 ${index + 1}`,
        mastery: 50,
        weakness: ['理解不透彻', '练习不足'],
        behavior_pattern: ['答题错误'],
        recommended_segments: [
          { segment_id: 's1', video_id: 1, start_ms: 120000, end_ms: 200000 },
        ],
        relatedVideos: [],
      }));
    }
    setCurrentWeakPoints(current);
    setWeakPoints(history);
  }, [searchParams]);

  const toggleHistory = () => {
    setHistoryExpanded(!historyExpanded);
  };

  const watchExplanation = async (point) => {
    if (!point) return;
    setLoadingText('正在获取解析...');
    setLoading(true);
    try {
      const res = await request.post('/agent/chat', {
        video_id: 1,
        knowledge_id: point.knowledge_id,
        text: `请详细解释${point.title || point.knowledge_id}这个知识点`,
      });
      setLoading(false);
      if ((res.code === 0 || res.code === 200) && res.data) {
        setModalTitle(point.title || '知识点解析');
        setModalBody(res.data.reply || res.data.context || '暂无详细解析');
      } else {
        setModalTitle(point.title || '知识点解析');
        setModalBody(point.description || '该知识点需要加强练习。建议观看相关讲解视频后，再进行练习。');
      }
    } catch (err) {
      setLoading(false);
      setModalTitle(point.title || '知识点解析');
      setModalBody(point.description || '该知识点需要加强练习。');
    }
    setShowExplanationModal(true);
  };

  const startPractice = (point) => {
    if (!point) return;
    navigate(`/student/practice?knowledgeId=${point.knowledge_id}&title=${encodeURIComponent(point.title || '薄弱点练习')}`);
  };

  const jumpToSegment = (point, segIndex) => {
    if (!point || !point.recommended_segments) return;
    const segment = point.recommended_segments[segIndex];
    if (!segment) return;
    const videoId = segment.video_id || 1;
    const startTime = Math.floor(segment.start_ms / 1000);
    navigate(`/student/video/0/${videoId}?startTime=${startTime}`);
  };

  const playVideo = (video) => {
    if (!video) return;
    navigate(`/student/video/0/${video.video_id}`);
  };

  const openAIAssistant = () => {
    const wp = currentWeakPoints.length > 0 ? currentWeakPoints : historyWeakPoints;
    const weakTitles = wp.map(p => p.title || p.knowledge_id).join('、');
    navigate(`/student/chat?videoId=1&context=weakness&weakPoints=${encodeURIComponent(weakTitles)}`);
  };

  const closeModal = () => {
    setShowExplanationModal(false);
  };

  const renderWeakPointCard = (item, index, type) => {
    const mastery = item.mastery || item.weak_rate || 50;
    const badgeClass = mastery < 50 ? 'danger' : 'warning';

    return (
      <div key={`${type}-${index}`} className="wp-card">
        <div className="wp-card-header">
          <span className="wp-card-name">{item.title || item.knowledge_id}</span>
          <span className={`wp-mastery-badge ${badgeClass}`}>{mastery}%</span>
        </div>

        {item.weakness && item.weakness.length > 0 && (
          <div className="wp-detail">
            <span className="wp-detail-label">薄弱原因：</span>
            <div className="wp-detail-tags">
              {item.weakness.map((w, i) => <span key={i} className="wp-detail-tag">{w}</span>)}
            </div>
          </div>
        )}

        {item.behavior_pattern && item.behavior_pattern.length > 0 && (
          <div className="wp-behavior-pattern">
            <span className="wp-pattern-label">学习行为：</span>
            <span className="wp-pattern-text">{item.behavior_pattern.join('、')}</span>
          </div>
        )}

        {item.recommended_segments && item.recommended_segments.length > 0 && (
          <div className="wp-recommended-section">
            <span className="wp-recommended-label">📍 推荐学习片段：</span>
            <div className="wp-segment-list">
              {item.recommended_segments.map((seg, segIndex) => (
                <span
                  key={segIndex}
                  className="wp-segment-btn"
                  onClick={() => jumpToSegment(item, segIndex)}
                >
                  <span className="wp-segment-time">{formatTime(seg.start_ms)}</span>
                  <span className="wp-segment-duration">{formatDurationMs(seg.end_ms - seg.start_ms)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {item.relatedVideos && item.relatedVideos.length > 0 && (
          <div className="wp-video-section">
            <span className="wp-video-label">📹 相关讲解视频：</span>
            {item.relatedVideos.map((video, vi) => (
              <div key={vi} className="wp-video-card" onClick={() => playVideo(video)}>
                <div className="wp-video-thumb" />
                <div className="wp-video-info">
                  <span className="wp-video-title">{video.title || '讲解视频'}</span>
                  <span className="wp-video-duration">{video.duration || '10:00'}</span>
                </div>
                <span className="wp-play-icon">▶</span>
              </div>
            ))}
          </div>
        )}

        <div className="wp-action-row">
          <button className="wp-btn-watch" onClick={() => watchExplanation(item)}>📖 查看解析</button>
          <button className="wp-btn-practice" onClick={() => startPractice(item)}>✍️ 开始练习</button>
        </div>
      </div>
    );
  };

  return (
    <div className="weak-points-page">
      {/* Nav bar */}
      <div className="wp-nav-bar">
        <span className="wp-nav-title">薄弱点巩固</span>
      </div>

      <div className="wp-container">
        {/* History section */}
        <div className="wp-section">
          <div className="wp-section-header" onClick={toggleHistory}>
            <div className="wp-section-title-row">
              <span className="wp-section-icon">📚</span>
              <span className="wp-section-title">历史薄弱点</span>
            </div>
            <span className="wp-section-toggle">{historyExpanded ? '收起' : '展开'}</span>
          </div>

          {historyExpanded && (
            <div className="wp-history-list">
              {historyWeakPoints.length === 0 ? (
                <div className="wp-empty-history">
                  <span className="wp-empty-text">暂无历史薄弱点记录</span>
                </div>
              ) : (
                historyWeakPoints.map((item, index) => (
                  <div
                    key={index}
                    className="wp-history-item"
                    onClick={() => startPractice(item)}
                  >
                    <div className="wp-history-main">
                      <span className="wp-history-name">{item.title || item.knowledge_id}</span>
                      <span className="wp-history-mastery">掌握度: {item.mastery || item.weak_rate || 50}%</span>
                    </div>
                    {item.relatedVideos && item.relatedVideos.length > 0 && (
                      <div className="wp-history-video">
                        <span className="wp-video-count">📹 {item.relatedVideos.length}个讲解视频</span>
                      </div>
                    )}
                    <span className="wp-history-arrow">›</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Current weak points */}
        {currentWeakPoints.length > 0 && (
          <div className="wp-section">
            <div className="wp-section-title-row-static">
              <span className="wp-section-icon">💪</span>
              <span className="wp-section-title">本次待巩固</span>
            </div>
            <div className="wp-points-list">
              {currentWeakPoints.map((item, index) => renderWeakPointCard(item, index, 'current'))}
            </div>
          </div>
        )}

        {/* All weak points */}
        <div className="wp-section">
          <div className="wp-section-title-row-static">
            <span className="wp-section-icon">📊</span>
            <span className="wp-section-title">薄弱知识点</span>
          </div>
          <div className="wp-points-list">
            {weakPoints.length === 0 ? (
              <div className="wp-empty-state">
                <span className="wp-empty-icon-large">🎉</span>
                <span className="wp-empty-title-large">太棒了！</span>
                <span className="wp-empty-desc">你目前没有薄弱知识点，继续保持！</span>
              </div>
            ) : (
              weakPoints.map((item, index) => renderWeakPointCard(item, index, 'all'))
            )}
          </div>
        </div>

        {/* AI Assistant entry */}
        <div className="wp-ai-section" onClick={openAIAssistant}>
          <div className="wp-ai-content">
            <span className="wp-ai-icon">🤖</span>
            <div className="wp-ai-text">
              <span className="wp-ai-title">AI 智能辅导</span>
              <span className="wp-ai-desc">有疑问？问问 AI 助手</span>
            </div>
          </div>
          <span className="wp-ai-arrow">›</span>
        </div>
      </div>

      {/* Loading mask */}
      {loading && (
        <div className="wp-loading-mask">
          <div className="wp-loading-content">
            <div className="wp-loading-spinner" />
            <span className="wp-loading-text">{loadingText}</span>
          </div>
        </div>
      )}

      {/* Explanation modal */}
      {showExplanationModal && (
        <div className="wp-modal">
          <div className="wp-modal-mask" onClick={closeModal} />
          <div className="wp-modal-content">
            <div className="wp-modal-title">{modalTitle}</div>
            <div className="wp-modal-body">{modalBody}</div>
            <div className="wp-modal-footer">
              <span className="wp-modal-btn" onClick={closeModal}>我知道了</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
