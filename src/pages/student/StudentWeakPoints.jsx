import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-weak-points', `
  .weak-points-page { min-height: 100vh; background: #f5f5f5; }
  .wp-nav-bar {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 14px 16px; color: #fff; text-align: center;
    position: sticky; top: 0; z-index: 100;
  }
  .wp-nav-title { font-size: 17px; font-weight: 600; }
  .wp-container { padding: 12px; }
  .wp-section { margin-bottom: 12px; }
  .wp-section-header {
    background: #fff; border-radius: 10px; padding: 14px 16px;
    display: flex; justify-content: space-between; align-items: center;
    cursor: pointer;
  }
  .wp-section-title-row { display: flex; align-items: center; gap: 8px; }
  .wp-section-title-row-static { display: flex; align-items: center; gap: 8px; padding: 0 4px 10px; }
  .wp-section-icon { font-size: 18px; }
  .wp-section-title { font-size: 15px; font-weight: 600; color: #333; }
  .wp-section-toggle { font-size: 13px; color: #7c3aed; }
  .wp-history-list { background: #fff; border-radius: 0 0 10px 10px; overflow: hidden; }
  .wp-empty-history { padding: 20px; text-align: center; }
  .wp-empty-text { font-size: 13px; color: #999; }
  .wp-history-item {
    display: flex; align-items: center; padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5; cursor: pointer;
  }
  .wp-history-item:last-child { border-bottom: none; }
  .wp-history-main { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .wp-history-name { font-size: 14px; color: #333; font-weight: 500; }
  .wp-history-mastery { font-size: 12px; color: #999; }
  .wp-history-video { margin-right: 8px; }
  .wp-video-count { font-size: 12px; color: #7c3aed; }
  .wp-history-arrow { font-size: 18px; color: #ccc; }
  .wp-points-list { display: flex; flex-direction: column; gap: 10px; }
  .wp-card { background: #fff; border-radius: 12px; padding: 16px; }
  .wp-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .wp-card-name { font-size: 16px; font-weight: 600; color: #333; }
  .wp-mastery-badge { font-size: 12px; padding: 4px 10px; border-radius: 12px; font-weight: 600; }
  .wp-mastery-badge.danger { background: #fee2e2; color: #ef4444; }
  .wp-mastery-badge.warning { background: #fef3c7; color: #d97706; }
  .wp-detail { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
  .wp-detail-label { font-size: 12px; color: #999; white-space: nowrap; }
  .wp-detail-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .wp-detail-tag { font-size: 11px; padding: 3px 8px; background: #f0f2ff; color: #7c3aed; border-radius: 6px; }
  .wp-behavior-pattern { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .wp-pattern-label { font-size: 12px; color: #999; }
  .wp-pattern-text { font-size: 12px; color: #666; }
  .wp-recommended-section { margin-bottom: 8px; }
  .wp-recommended-label { font-size: 12px; color: #666; display: block; margin-bottom: 6px; }
  .wp-segment-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .wp-segment-btn { display: flex; gap: 6px; padding: 6px 12px; background: #f0f2ff; border-radius: 8px; font-size: 12px; cursor: pointer; }
  .wp-segment-time { color: #7c3aed; font-weight: 600; }
  .wp-segment-duration { color: #999; }
  .wp-video-section { margin-bottom: 8px; }
  .wp-video-label { font-size: 12px; color: #666; display: block; margin-bottom: 6px; }
  .wp-video-card { display: flex; align-items: center; gap: 10px; padding: 10px; background: #f9fafb; border-radius: 8px; cursor: pointer; margin-bottom: 6px; }
  .wp-video-thumb { width: 40px; height: 30px; background: #ddd; border-radius: 4px; flex-shrink: 0; }
  .wp-video-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .wp-video-title { font-size: 13px; color: #333; }
  .wp-video-duration { font-size: 11px; color: #999; }
  .wp-play-icon { font-size: 16px; color: #7c3aed; }
  .wp-action-row { display: flex; gap: 10px; margin-top: 12px; }
  .wp-btn-watch, .wp-btn-practice {
    flex: 1; padding: 10px 0; border-radius: 20px; font-size: 13px;
    text-align: center; cursor: pointer; border: none;
  }
  .wp-btn-watch { background: #ede9fe; color: #7c3aed; }
  .wp-btn-practice { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .wp-ai-section {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    border-radius: 12px; padding: 16px; margin-bottom: 12px;
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; color: #fff;
  }
  .wp-ai-content { display: flex; align-items: center; gap: 12px; }
  .wp-ai-icon { font-size: 32px; }
  .wp-ai-text { display: flex; flex-direction: column; }
  .wp-ai-title { font-size: 16px; font-weight: 600; }
  .wp-ai-desc { font-size: 12px; opacity: 0.8; }
  .wp-ai-arrow { font-size: 24px; }
  .wp-empty-state { text-align: center; padding: 40px 20px; }
  .wp-empty-icon-large { font-size: 64px; display: block; margin-bottom: 12px; }
  .wp-empty-title-large { font-size: 18px; font-weight: 600; color: #333; display: block; margin-bottom: 6px; }
  .wp-empty-desc { font-size: 13px; color: #999; display: block; }
  .wp-loading-mask {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255,255,255,0.8); z-index: 999;
    display: flex; align-items: center; justify-content: center;
  }
  .wp-loading-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .wp-loading-spinner {
    width: 30px; height: 30px; border: 3px solid #e5e7eb;
    border-top-color: #7c3aed; border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .wp-loading-text { font-size: 14px; color: #666; }
  .wp-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; }
  .wp-modal-mask { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); }
  .wp-modal-content { position: relative; width: 85%; max-width: 320px; background: #fff; border-radius: 12px; overflow: hidden; animation: slideUp 0.3s ease; }
  .wp-modal-title { padding: 16px; text-align: center; font-size: 17px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
  .wp-modal-body { padding: 16px; font-size: 14px; color: #666; line-height: 1.6; white-space: pre-wrap; }
  .wp-modal-footer { border-top: 1px solid #f0f0f0; display: flex; }
  .wp-modal-btn { flex: 1; padding: 12px 0; text-align: center; font-size: 15px; cursor: pointer; color: #7c3aed; font-weight: 600; }
`);

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

// Mock data — 数值分析薄弱点
const MOCK_HISTORY = [
  {
    knowledge_id: 'k1',
    title: 'Lagrange 插值误差分析',
    mastery: 45,
    weak_rate: 55,
    description: '插值余项估计和 Runge 现象理解不深',
    weakness: ['余项公式推导', 'Runge 现象判断'],
    behavior_pattern: ['频繁暂停', '重复观看'],
    relatedVideos: [
      { video_id: 101, title: 'Lagrange 插值精讲', duration: '8:30' },
      { video_id: 102, title: '插值误差分析实例', duration: '12:15' },
    ],
  },
  {
    knowledge_id: 'k2',
    title: 'Gauss 型数值积分',
    mastery: 48,
    weak_rate: 52,
    description: '正交多项式和 Gauss 求积节点的理解不足',
    weakness: ['正交多项式概念', '求积节点计算'],
    behavior_pattern: ['回看视频'],
    relatedVideos: [
      { video_id: 201, title: 'Gauss 积分推导', duration: '10:00' },
    ],
  },
  {
    knowledge_id: 'k3',
    title: 'Newton 迭代收敛性',
    mastery: 52,
    weak_rate: 48,
    description: 'Newton 迭代法的收敛阶分析和重根处理',
    weakness: ['收敛阶证明', '重根修正公式'],
    behavior_pattern: ['答题正确率低'],
    relatedVideos: [],
  },
  {
    knowledge_id: 'k4',
    title: '线性方程组迭代法',
    mastery: 40,
    weak_rate: 60,
    description: 'Jacobi/Gauss-Seidel 迭代的收敛性判断困难',
    weakness: ['谱半径计算', '迭代矩阵构造'],
    behavior_pattern: ['频繁暂停'],
    relatedVideos: [
      { video_id: 301, title: '迭代法收敛性分析', duration: '15:00' },
    ],
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
