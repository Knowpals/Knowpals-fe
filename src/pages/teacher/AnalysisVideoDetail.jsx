import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Space, Spin } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/TeacherLayout';
import { getVideoDetail, getMyCreatedClasses, getVideoTasks } from '../../services/teacherApi';

const { Option } = Select;

const AnalysisVideoDetail = () => {
  const navigate = useNavigate();
  const { knowledgeId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedVideoId) {
      fetchVideoDetail(selectedVideoId);
    }
  }, [selectedVideoId]);

  const fetchClasses = async () => {
    try {
      const res = await getMyCreatedClasses();
      const classList = res.data?.class_list || [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].class_id);
        fetchClassVideos(classList[0].class_id);
      }
    } catch (error) {
      console.error('获取班级列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassVideos = async (classId) => {
    try {
      const res = await getVideoTasks(classId);
      const videoList = res.data?.video_tasks || [];
      setVideos(videoList);
      if (videoList.length > 0 && !selectedVideoId) {
        setSelectedVideoId(videoList[0].video_id);
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
    }
  };

  const fetchVideoDetail = async (videoId) => {
    try {
      const res = await getVideoDetail(videoId);
      setVideoData(res.data);
    } catch (error) {
      console.error('获取视频详情失败:', error);
    }
  };

  // 根据视频时长和互动点构建进度条标记
  const segments = videoData?.segments || [];
  const duration = videoData?.duration || 0;

  if (loading) {
    return (
      <MainLayout pageTitle="班级学情数据分析" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="班级学情数据分析-知识点详情"
      showBack
    >
      {/* 顶部标题栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <Form form={form} layout="inline">
          <Form.Item name="class">
            <Select
              style={{ width: 150 }}
              value={selectedClass}
              onChange={(value) => {
                setSelectedClass(value);
                setSelectedVideoId(null);
                setVideoData(null);
                fetchClassVideos(value);
              }}
            >
              {classes.map((cls) => (
                <Option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="videoTitle">
            <Select
              style={{ width: 220 }}
              value={selectedVideoId}
              onChange={(v) => setSelectedVideoId(v)}
              placeholder="选择视频"
            >
              {videos.map((v) => (
                <Option key={v.video_id} value={v.video_id}>
                  {v.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <Button type="link" style={{ color: '#fa8c16' }} onClick={() => navigate('/data-analysis')}>
          返回数据分析
        </Button>
      </div>

      {/* 视频播放器区域 */}
      {videoData?.url ? (
        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
          <video
            src={videoData.url}
            controls
            style={{ width: '100%', maxHeight: 500, display: 'block' }}
          />
        </div>
      ) : (
        <div style={{
          width: '100%',
          background: '#9ca3af',
          borderRadius: 12,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
          color: '#fff',
        }}>
          {selectedVideoId ? (
            <>
              <Spin style={{ marginBottom: 16 }} />
              <span>加载视频中...</span>
            </>
          ) : (
            <>
              <PlayCircleOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }} />
              <span style={{ opacity: 0.8 }}>请选择视频查看详情</span>
            </>
          )}
        </div>
      )}

      {/* 互动点时间线（从后端真实数据渲染） */}
      {segments.length > 0 && (
        <div style={{
          marginTop: 24,
          background: '#fff',
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
            视频分段与互动点（{segments.length} 个）
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {segments.map((seg, idx) => {
              const startPct = duration > 0 ? (seg.start / duration) * 100 : 0;
              const hasQuestion = seg.question && Object.keys(seg.question).length > 0;
              return (
                <div key={seg.id || idx} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', background: '#f9fafb', borderRadius: 8,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: hasQuestion ? '#7c3aed' : '#d1d5db',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>
                      {seg.text || `分段 ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {Math.floor(seg.start)}s - {Math.floor(seg.end)}s
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>
                    {hasQuestion ? '含互动题' : ''}
                  </div>
                  {/* 进度条上的标记位置 */}
                  <div style={{ width: 80, height: 4, background: '#f0f0f0', borderRadius: 2, position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      position: 'absolute',
                      left: `${startPct}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 8, height: 8, borderRadius: '50%',
                      background: hasQuestion ? '#7c3aed' : '#9ca3af',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AnalysisVideoDetail;
