import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import request from '../../utils/request';

const StudentAIChat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const messageListRef = useRef(null);
  const msgIdRef = useRef(0);

  const videoId = searchParams.get('videoId');
  const videoTitle = searchParams.get('videoTitle') || '当前视频';
  const currentTime = searchParams.get('currentTime') || '';
  const videoDuration = searchParams.get('videoDuration') || 0;

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedAI');
    if (hasVisited) setShowIntro(false);
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    if (!videoId) return;
    try {
      const res = await request.get('/agent/history', { params: { video_id: String(videoId), limit: '20' } });
      let historyMsgs = [];
      if (Array.isArray(res.data)) historyMsgs = res.data;
      else if (res.data?.messages) historyMsgs = res.data.messages;

      if (historyMsgs.length > 0) {
        const msgs = historyMsgs.map((msg) => ({
          id: ++msgIdRef.current,
          role: msg.role === 'user' ? 'user' : 'ai',
          type: 'text',
          content: msg.content || msg.text || msg.message || '',
          time: msg.time || formatTime(new Date()),
        }));
        setMessages(msgs);
        setShowIntro(false);
      }
    } catch (e) {
      console.error('加载历史失败:', e);
    }
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const hideIntro = () => {
    setShowIntro(false);
    localStorage.setItem('hasVisitedAI', 'true');
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: ++msgIdRef.current, role: 'user', type: 'text', content: text, time: formatTime(new Date()) };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowMoreOptions(false);
    setShowIntro(false);
    setLoading(true);

    try {
      if (!videoId) {
        setMessages((prev) => [...prev, { id: ++msgIdRef.current, role: 'ai', type: 'text', content: '请先选择视频后再提问。', time: formatTime(new Date()) }]);
        setLoading(false);
        return;
      }
      const res = await request.post('/agent/chat', { video_id: String(videoId), text });
      if ((res.code === 0 || res.code === 200) && res.data) {
        const aiMsg = processAIResponse(res.data, text);
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [...prev, getMockResponse(text)]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, getMockResponse(text)]);
    } finally {
      setLoading(false);
    }
  };

  const processAIResponse = (data, question) => {
    let reply = data.reply || data.text || data.content || data.message || '';
    if (typeof reply === 'object' && reply !== null) {
      reply = reply.text || reply.content || reply.message || JSON.stringify(reply);
    }
    if (!reply || reply === 'null' || reply === '{}' || reply === '[]') {
      reply = '抱歉，我暂时无法回答这个问题。';
    }
    if (typeof reply !== 'string') reply = String(reply);

    const q = question.toLowerCase();
    const msgId = ++msgIdRef.current;

    if (q.includes('练习') || q.includes('题目') || q.includes('做题')) {
      return { id: msgId, role: 'ai', type: 'text', content: reply + '\n\n如需开始练习，可前往练习页面。', time: formatTime(new Date()), showPracticeButton: true };
    }
    if ((q.includes('解释') || q.includes('概念') || q.includes('什么是')) && !q.includes('练习')) {
      return { id: msgId, role: 'ai', type: 'knowledge', content: { title: '知识点详解', description: reply, tags: [] }, time: formatTime(new Date()) };
    }
    if (q.includes('视频') || q.includes('推荐')) {
      return { id: msgId, role: 'ai', type: 'video', content: parseVideoRecommendations(reply), time: formatTime(new Date()) };
    }
    return { id: msgId, role: 'ai', type: 'text', content: reply, time: formatTime(new Date()), video_id: data.video_id };
  };

  const parseVideoRecommendations = () => [
    { title: '勾股定理证明方法', duration: '8:30', video_id: 101 },
    { title: '勾股定理应用实例', duration: '12:15', video_id: 102 },
    { title: '直角三角形判定技巧', duration: '6:45', video_id: 103 },
  ];

  const getMockResponse = (question) => {
    const q = question.toLowerCase();
    const msgId = ++msgIdRef.current;

    if (q.includes('讲') || q.includes('内容') || q.includes('总结')) {
      return { id: msgId, role: 'ai', type: 'text', content: '这节课主要讲解了勾股定理的概念和应用。\n\n核心知识点：\n1. 勾股定理的定义\n2. 勾股定理的证明方法\n3. 勾股定理在实际问题中的应用\n\n建议观看配套练习视频来巩固知识哦！', time: formatTime(new Date()) };
    }
    if (q.includes('解释') || q.includes('概念') || q.includes('什么是')) {
      return { id: msgId, role: 'ai', type: 'knowledge', content: { title: '勾股定理', description: '勾股定理是平面几何中最重要的定理之一。它指出：在直角三角形中，两条直角边的平方和等于斜边的平方。用公式表示为：a² + b² = c²，其中 a、b 为直角边，c 为斜边。', tags: ['几何', '直角三角形', '平方'] }, time: formatTime(new Date()) };
    }
    if (q.includes('练习') || q.includes('题目') || q.includes('做题')) {
      return { id: msgId, role: 'ai', type: 'question', content: { title: '已知直角三角形的两条直角边分别为3和4，请问斜边的长度是多少？', options: [{ id: 0, letter: 'A', text: '5', isCorrect: true }, { id: 1, letter: 'B', text: '6', isCorrect: false }, { id: 2, letter: 'C', text: '7', isCorrect: false }, { id: 3, letter: 'D', text: '8', isCorrect: false }] }, time: formatTime(new Date()) };
    }
    if (q.includes('视频') || q.includes('推荐')) {
      return { id: msgId, role: 'ai', type: 'video', content: parseVideoRecommendations(), time: formatTime(new Date()) };
    }
    return { id: msgId, role: 'ai', type: 'text', content: `好的，我理解你的问题。"${question.substring(0, 20)}..."\n\n关于这个知识点，我来为你详细解答...\n\n有其他问题可以继续问我！`, time: formatTime(new Date()) };
  };

  const sendQuickQuestion = (q) => {
    setInput(q);
    const userMsg = { id: ++msgIdRef.current, role: 'user', type: 'text', content: q, time: formatTime(new Date()) };
    setMessages((prev) => [...prev, userMsg]);
    setShowIntro(false);
    setLoading(true);

    if (videoId) {
      request.post('/agent/chat', { video_id: String(videoId), text: q })
        .then((res) => {
          if ((res.code === 0 || res.code === 200) && res.data) {
            const aiMsg = processAIResponse(res.data, q);
            setMessages((prev) => [...prev, aiMsg]);
          } else {
            setMessages((prev) => [...prev, getMockResponse(q)]);
          }
        })
        .catch(() => {
          setMessages((prev) => [...prev, getMockResponse(q)]);
        })
        .finally(() => setLoading(false));
    } else {
      setMessages((prev) => [...prev, getMockResponse(q)]);
      setLoading(false);
    }
  };

  const requestVideoSummary = () => {
    setShowMoreOptions(false);
    if (!videoId) { message.info('请从视频页面进入'); return; }
    sendQuickQuestion('请总结这节课的内容');
  };

  const requestKnowledgeGraph = () => {
    setShowMoreOptions(false);
    if (!videoId) { message.info('请从视频页面进入'); return; }
    sendQuickQuestion('请给我展示这节课的知识图谱');
  };

  const requestPractice = () => {
    setShowMoreOptions(false);
    if (!videoId) { message.info('请从视频页面进入'); return; }
    sendQuickQuestion('请给我出一道练习题');
  };

  const requestRelatedVideos = () => {
    setShowMoreOptions(false);
    if (!videoId) { message.info('请从视频页面进入'); return; }
    sendQuickQuestion('请推荐一些相关视频');
  };

  const renderMessageContent = (msg) => {
    if (msg.type === 'knowledge' && msg.content && typeof msg.content === 'object') {
      return (
        <div className="ai-knowledge-card-v1">
          <div className="ai-knowledge-header-v1">
            <span className="ai-knowledge-icon-v1">💡</span>
            <span className="ai-knowledge-title-v1">{msg.content.title || ''}</span>
          </div>
          <span className="ai-knowledge-content-v1">{msg.content.description || ''}</span>
          {(msg.content.tags || []).length > 0 && (
            <div className="ai-knowledge-tags-v1">
              {msg.content.tags.map((tag, i) => (
                <span key={i} className="ai-knowledge-tag-v1">{tag}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (msg.type === 'question' && msg.content && typeof msg.content === 'object') {
      return (
        <div className="ai-question-card-v1">
          <div className="ai-question-header-v1">
            <span className="ai-question-icon-v1">✍️</span>
            <span className="ai-question-label-v1">练习题</span>
          </div>
          <span className="ai-question-title-v1">{msg.content.title || ''}</span>
          <div className="ai-question-options-v1">
            {(msg.content.options || []).map((opt) => (
              <div key={opt.id} className={`ai-question-option-v1 ${opt.selected ? 'selected' : ''} ${msg.submitted ? (opt.isCorrect ? 'correct' : (opt.selected && !opt.isCorrect ? 'wrong' : '')) : ''}`}>
                <span className="ai-option-letter-v1">{opt.letter}</span>
                <span className="ai-option-text-v1">{opt.text}</span>
              </div>
            ))}
          </div>
          {msg.feedback && (
            <div className={`ai-practice-feedback-v1 ${msg.feedback.includes('正确') ? 'correct' : 'wrong'}`}>
              {msg.feedback}
            </div>
          )}
        </div>
      );
    }

    if (msg.type === 'video' && Array.isArray(msg.content)) {
      return (
        <div className="ai-video-card-v1">
          <div className="ai-video-header-v1">
            <span className="ai-video-icon-v1">🎥</span>
            <span className="ai-video-label-v1">相关视频推荐</span>
          </div>
          <div className="ai-video-list-v1">
            {msg.content.map((v, i) => (
              <div key={i} className="ai-video-item-v1" onClick={() => navigate(`/student/video/${classId || 0}/${v.video_id}?title=${encodeURIComponent(v.title)}`)}>
                <div className="ai-video-thumb-v1">🎬</div>
                <div className="ai-video-info-v1">
                  <span className="ai-video-title-v1">{v.title}</span>
                  <span className="ai-video-duration-v1">{v.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="ai-msg-content-v1">{msg.content}</div>;
  };

  const classId = searchParams.get('classId');

  return (
    <div className="ai-chat-page-v1">
      {/* Nav bar */}
      <div className="ai-chat-nav-v1">
        <div className="ai-chat-nav-back-v1" onClick={() => navigate(-1)}>←</div>
        <span className="ai-chat-nav-title-v1">AI 伴学助手</span>
        <span className="ai-chat-status-v1 online">在线</span>
      </div>

      {/* Video context */}
      {videoId && (
        <div className="ai-video-context-v1">
          <span>🎥</span>
          <span className="ai-context-text-v1">当前：{videoTitle}{currentTime ? ` - ${currentTime}` : ''}</span>
        </div>
      )}

      {/* AI intro card */}
      {showIntro && (
        <div className="ai-intro-card-v1">
          <div className="ai-intro-avatar-v1">🤖</div>
          <div className="ai-intro-info-v1">
            <span className="ai-intro-name-v1">知伴 AI 助手</span>
            <span className="ai-intro-desc-v1">随时为你解答学习中的疑问</span>
          </div>
          <div className="ai-intro-close-v1" onClick={hideIntro}>知道了</div>
        </div>
      )}

      {/* Quick questions */}
      {showIntro && (
        <div className="ai-quick-questions-v1">
          <div className="ai-quick-scroll-v1">
            {['这节课讲了什么？', '请解释这个概念', '出一道练习题', '推荐相关视频'].map((q) => (
              <span key={q} className="ai-quick-item-v1" onClick={() => sendQuickQuestion(q)}>{q}</span>
            ))}
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="ai-message-list-v1" ref={messageListRef}>
        {showIntro && (
          <div className="ai-welcome-msg-v1">
            <div className="ai-welcome-avatar-v1">🤖</div>
            <div className="ai-welcome-bubble-v1">
              <span className="ai-welcome-title-v1">你好，我是知伴 AI 助手</span>
              <span className="ai-welcome-desc-v1">我可以帮你解答视频学习中的问题，也可以和你讨论知识点。有什么不懂的地方，尽管问我吧！</span>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-msg-row-v1 ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`ai-msg-avatar-v1 ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={`ai-msg-bubble-v1 ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {renderMessageContent(msg)}
              {msg.showPracticeButton && (
                <div className="ai-start-practice-btn-v1" onClick={() => navigate(`/student/practice?videoId=${videoId}&title=${encodeURIComponent('AI推荐练习')}`)}>
                  开始练习
                </div>
              )}
              <div className="ai-msg-time-v1">{msg.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-msg-row-v1 ai">
            <div className="ai-msg-avatar-v1 ai">🤖</div>
            <div className="ai-msg-bubble-v1 ai">
              <div className="ai-typing-dots-v1">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weak points float entry */}
      {videoId && (
        <div className="ai-weak-points-float-v1" onClick={() => navigate('/student/weak-points')}>
          <span className="ai-float-icon-v1">⚠️</span>
          <span className="ai-float-text-v1">薄弱点复习</span>
        </div>
      )}

      {/* Input area */}
      <div className="ai-input-area-v1">
        <div className="ai-input-row-v1">
          <div className="ai-input-wrapper-v1">
            <input
              className="ai-input-v1"
              placeholder="输入你的问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <div className="ai-attach-btn-v1" onClick={() => setShowMoreOptions(!showMoreOptions)}>📎</div>
          </div>
          <div className={`ai-send-btn-v1 ${input.trim() ? 'active' : ''}`} onClick={sendMessage}>发送</div>
        </div>

        {/* More options */}
        {showMoreOptions && (
          <div className="ai-more-options-v1">
            <div className="ai-option-item-v1" onClick={requestVideoSummary}>
              <span>📋</span><span>视频总结</span>
            </div>
            <div className="ai-option-item-v1" onClick={requestKnowledgeGraph}>
              <span>🧠</span><span>知识图谱</span>
            </div>
            <div className="ai-option-item-v1" onClick={requestPractice}>
              <span>✍️</span><span>练习题目</span>
            </div>
            <div className="ai-option-item-v1" onClick={requestRelatedVideos}>
              <span>🎥</span><span>相关视频</span>
            </div>
            <div className="ai-option-item-v1" onClick={() => { setShowMoreOptions(false); navigate(`/student/report?videoId=${videoId}`); }}>
              <span>📊</span><span>学情报告</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAIChat;
