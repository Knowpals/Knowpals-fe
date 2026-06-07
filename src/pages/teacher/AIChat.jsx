import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Select, Typography, Space, Spin, Empty, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import MainLayout from '../../layouts/TeacherLayout';
import { agentChat, getChatHistory, getMyUploadedVideos } from '../../services/teacherApi';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const AIChat = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchVideos = async () => {
    try {
      const res = await getMyUploadedVideos();
      setVideos(res.data?.videos || []);
    } catch (error) {
      console.error('获取视频列表失败:', error);
    }
  };

  const loadHistory = async (videoId) => {
    setLoadingHistory(true);
    try {
      const res = await getChatHistory({ video_id: videoId, limit: 50 });
      const historyMessages = (res.data?.messages || []).map((msg) => ({
        role: msg.role,
        content: msg.text,
        time: msg.created_at,
        knowledge_id: msg.knowledge_id,
      }));
      setMessages(historyMessages);
    } catch (error) {
      console.error('获取历史消息失败:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleVideoChange = (videoId) => {
    setSelectedVideo(videoId);
    setMessages([]);
    if (videoId) {
      loadHistory(videoId);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedVideo) return;
    const userMsg = { role: 'user', content: inputText.trim(), time: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const res = await agentChat({
        video_id: String(selectedVideo),
        text: userMsg.content,
      });
      const reply = res.data?.reply || '抱歉，AI 暂时无法回复。';
      const aiMsg = {
        role: 'assistant',
        content: reply,
        time: new Date().toISOString(),
        knowledge_id: res.data?.knowledge_id,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = error.message || '请求失败，请稍后重试';
      setMessages((prev) => [...prev, { role: 'system', content: `[错误] ${errorMsg}`, time: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MainLayout pageTitle="AI 教学助手">
      <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 160px)' }}>
        {/* 左侧：对话区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#722ed1' }} />
                <span>AI 对话</span>
              </Space>
            }
            extra={
              <Button size="small" icon={<DeleteOutlined />} onClick={() => setMessages([])} disabled={messages.length === 0}>
                清空对话
              </Button>
            }
            styles={{ body: { flex: 1, overflow: 'auto', padding: 16 } }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 12 }}
          >
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
              ) : messages.length === 0 ? (
                <Empty description={selectedVideo ? '开始和 AI 讨论视频内容吧' : '请先选择一个视频'} />
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 16px',
                        borderRadius: 12,
                        background:
                          msg.role === 'user' ? '#722ed1'
                          : msg.role === 'system' ? '#fff2f0'
                          : '#f5f5f5',
                        color:
                          msg.role === 'user' ? '#fff'
                          : msg.role === 'system' ? '#ff4d4f'
                          : '#333',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {msg.role === 'user' ? <UserOutlined style={{ fontSize: 12 }} /> : msg.role === 'assistant' ? <RobotOutlined style={{ fontSize: 12, color: '#722ed1' }} /> : null}
                        <Text style={{ fontSize: 11, color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#999' }}>
                          {msg.role === 'user' ? '我' : msg.role === 'system' ? '系统' : 'AI 助手'}
                        </Text>
                      </div>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 14 }}>
                        {msg.content}
                      </Paragraph>
                      {msg.knowledge_id && (
                        <Tag style={{ marginTop: 6, fontSize: 11 }} color="purple">知识点: {msg.knowledge_id}</Tag>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <TextArea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedVideo ? '输入问题，与 AI 讨论视频内容...' : '请先选择视频'}
                rows={2}
                disabled={!selectedVideo || sending}
                style={{ flex: 1, resize: 'none' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sending}
                disabled={!selectedVideo || !inputText.trim()}
                style={{ alignSelf: 'flex-end', background: '#722ed1', borderColor: '#722ed1' }}
              >
                发送
              </Button>
            </div>
          </Card>
        </div>

        {/* 右侧：视频选择器 */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <Card title="选择视频" style={{ borderRadius: 12, height: '100%' }} styles={{ body: { padding: 12 } }}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择要讨论的视频"
              value={selectedVideo}
              onChange={handleVideoChange}
              allowClear
            >
              {videos.map((v) => (
                <Select.Option key={v.video_id} value={v.video_id}>
                  {v.title}
                </Select.Option>
              ))}
            </Select>
            {selectedVideo && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  提示：你可以向 AI 提问关于这个视频的知识点、题目解析、教学内容等问题。
                </Text>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIChat;
