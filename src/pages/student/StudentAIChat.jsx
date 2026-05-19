import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import request from '../../utils/request';

// V1 ai-chat.html 逻辑：AI 伴学助手
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
        let reply = res.data.reply || res.data.text || res.data.content || res.data.message || '';
        if (typeof reply === 'object' && reply !== null) {
          reply = reply.text || reply.content || reply.message || JSON.stringify(reply);
        }
        setMessages((prev) => [...prev, { id: ++msgIdRef.current, role: 'ai', type: 'text', content: String(reply || '抱歉，我暂时无法回答这个问题。'), time: formatTime(new Date()) }]);
      } else {
        setMessages((prev) => [...prev, getMockResponse(text)]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, getMockResponse(text)]);
    } finally {
      setLoading(false);
    }
  };

  const getMockResponse = (question) => ({
    id: ++msgIdRef.current, role: 'ai', type: 'text',
    content: `好的，关于"${question.substring(0, 20)}..."的问题，我来为你解答。\n\n这是相关的知识点，建议你可以查看视频中的讲解来加深理解。\n\n有其他问题可以继续问我！`,
    time: formatTime(new Date()),
  });

  const sendQuickQuestion = (q) => {
    setInput(q);
    const userMsg = { id: ++msgIdRef.current, role: 'user', type: 'text', content: q, time: formatTime(new Date()) };
    setMessages((prev) => [...prev, userMsg]);
    setShowIntro(false);
    setLoading(true);

    if (videoId) {
      request.post('/agent/chat', { video_id: String(videoId), text: q })
        .then((res) => {
          let reply = res.data?.reply || res.data?.text || res.data?.content || '';
          if (typeof reply === 'object') reply = reply.text || reply.content || JSON.stringify(reply);
          setMessages((prev) => [...prev, { id: ++msgIdRef.current, role: 'ai', type: 'text', content: String(reply || '抱歉。'), time: formatTime(new Date()) }]);
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

  const requestPractice = () => {
    setShowMoreOptions(false);
    if (!videoId) { message.info('请从视频页面进入'); return; }
    sendQuickQuestion('请给我出一道练习题');
  };

  return (
    <div className="ai-chat-page-v1">
      {/* 导航栏 */}
      <div className="ai-chat-nav-v1">
        <div className="ai-chat-nav-back-v1" onClick={() => navigate(-1)}>←</div>
        <span className="ai-chat-nav-title-v1">AI 伴学助手</span>
        <span className="ai-chat-status-v1 online">在线</span>
      </div>

      {/* 视频上下文 */}
      {videoId && (
        <div className="ai-video-context-v1">
          <span>🎥</span>
          <span className="ai-context-text-v1">当前：{videoTitle}{currentTime ? ` - ${currentTime}` : ''}</span>
        </div>
      )}

      {/* AI 介绍卡片 */}
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

      {/* 快捷提问 */}
      {showIntro && (
        <div className="ai-quick-questions-v1">
          <div className="ai-quick-scroll-v1">
            {['这节课讲了什么？', '请解释这个概念', '出一道练习题', '推荐相关视频'].map((q) => (
              <span key={q} className="ai-quick-item-v1" onClick={() => sendQuickQuestion(q)}>{q}</span>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 */}
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
              <div className="ai-msg-content-v1">{msg.content}</div>
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

      {/* 输入区域 */}
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

        {/* 更多功能 */}
        {showMoreOptions && (
          <div className="ai-more-options-v1">
            <div className="ai-option-item-v1" onClick={requestVideoSummary}>
              <span>📋</span><span>视频总结</span>
            </div>
            <div className="ai-option-item-v1" onClick={requestPractice}>
              <span>✍️</span><span>练习题目</span>
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
