import { useState, useEffect } from 'react';
import { Form, Select, Card, Progress, Tag, Spin, Row, Col } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/TeacherLayout';
import { getStudentStat, getVideoTasks, getStudentOverview } from '../../services/teacherApi';

const { Option } = Select;

function heatColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

const StudentData = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('class_id');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [statData, setStatData] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // 获取学生总体概览
  useEffect(() => {
    fetchOverview();
  }, [studentId]);

  // 获取班级视频列表
  useEffect(() => {
    if (classId) {
      fetchVideos();
    } else {
      setVideoLoading(false);
      setLoading(false);
    }
  }, [classId]);

  // 当选择的视频变化时，获取该视频的统计数据
  useEffect(() => {
    if (selectedVideo) {
      fetchVideoStat(selectedVideo);
    } else {
      setStatData(null);
    }
  }, [selectedVideo]);

  const fetchOverview = async () => {
    setOverviewLoading(true);
    try {
      const res = await getStudentOverview();
      if ((res.code === 0 || res.code === 200) && res.data) {
        setOverviewData(res.data);
      }
    } catch (e) {
      console.error('获取学生概览失败:', e);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchVideos = async () => {
    setVideoLoading(true);
    try {
      const res = await getVideoTasks(parseInt(classId));
      setVideos(res.data?.video_tasks || []);
    } catch (error) {
      console.error('获取视频列表失败:', error);
      setVideos([]);
    } finally {
      setVideoLoading(false);
      setLoading(false);
    }
  };

  const fetchVideoStat = async (videoId) => {
    try {
      const res = await getStudentStat(videoId);
      setStatData(res.data);
    } catch (error) {
      console.error('获取视频统计失败:', error);
      setStatData(null);
    }
  };

  // 从 statData 构建知识点掌握热力图数据
  const buildChaptersFromStat = () => {
    if (!statData?.knowledge_points || statData.knowledge_points.length === 0) return null;
    // 按 master_score 分组为假想的"章节"（每个知识点一行）
    return statData.knowledge_points.map(kp => ({
      name: kp.title,
      kps: [kp.title],
      scores: [Math.round((kp.master_score || 0) * 100)],
    }));
  };

  const chaptersData = buildChaptersFromStat();

  if (loading) {
    return (
      <MainLayout pageTitle="学生个人数据" showBack>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle={`学生个人数据 #${studentId}`} showBack>
      {/* 顶部筛选栏 */}
      <div style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline">
          <Form.Item name="video">
            <Select
              style={{ width: 200 }}
              placeholder="选择视频查看详情"
              onChange={setSelectedVideo}
              allowClear
              loading={videoLoading}
              disabled={!classId}
            >
              {videos.map((v) => (
                <Option key={v.video_id} value={v.video_id}>
                  {v.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {!classId && (
            <span style={{ fontSize: 12, color: '#999' }}>无法获取班级信息，请从班级详情页进入</span>
          )}
        </Form>
      </div>

      {/* 学情概览（真实接口数据） */}
      {!overviewLoading && overviewData && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧑‍🎓</span>
              <span>学习概览</span>
            </div>
          }
          style={{ marginBottom: 24, borderRadius: 12 }}
          headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: '#f5f3ff', borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>
                  {overviewData.total_watch_time_sec != null
                    ? `${Math.floor(overviewData.total_watch_time_sec / 60)}min`
                    : '-'}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>总学习时长</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: '#ecfdf5', borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>
                  {overviewData.correct_rate != null
                    ? `${(overviewData.correct_rate * 100).toFixed(0)}%`
                    : '-'}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>正确率</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: '#eff6ff', borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>
                  {overviewData.finished_count ?? '-'}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>已完成</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: '#fff7ed', borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f97316' }}>
                  {overviewData.total_count ?? '-'}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>总任务数</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 学生画像加载中 */}
      {overviewLoading && (
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: 24 }}>
          <Spin />
          <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>加载学生概览中...</div>
        </Card>
      )}

      {/* 核心数据卡片（选中视频后展示） */}
      {statData && (
        <>
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            <Card style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>视频观看时长</div>
                  <Progress
                    percent={statData?.time_cost ? Math.min((statData.time_cost / 3600) * 100, 100) : 0}
                    size="small"
                    status="active"
                  />
                </div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {statData?.time_cost ? `${Math.floor(statData.time_cost / 60)}分钟` : '0分钟'}
                </div>
              </div>
            </Card>
            <Card style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>答题正确率</div>
                  <Progress
                    percent={statData?.correct_rate ? statData.correct_rate * 100 : 0}
                    size="small"
                    strokeColor="#52c41a"
                    status="success"
                  />
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                  {statData?.correct_rate ? `${(statData.correct_rate * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
            </Card>
          </div>

          {/* 学习表现模块 */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            <Card title="任务完成情况" style={{ flex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>
                  {statData?.status || '未开始'}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  当前任务状态
                </div>
              </div>
            </Card>

            <Card title="学习行为分析" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
                    {statData?.pause_count || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>暂停次数</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>
                    {statData?.replay_count || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>回放次数</div>
                </div>
              </div>
            </Card>
          </div>

          {/* 知识点掌握热力图（来自真实数据） */}
          {chaptersData && chaptersData.length > 0 && (
            <Card
              title="知识点掌握度"
              style={{ marginBottom: 16, borderRadius: 12 }}
              headStyle={{ fontSize: 14, fontWeight: 600 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chaptersData.map((ch, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 120, fontSize: 12, color: '#6b7280', flexShrink: 0, textAlign: 'right' }}>
                      {ch.name}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                      {ch.scores.map((s, si) => (
                        <div
                          key={si}
                          title={`${ch.kps?.[si] || ''}: ${s}`}
                          style={{
                            width: 28, height: 28, borderRadius: 4,
                            background: heatColor(s),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 10, fontWeight: 600, flexShrink: 0,
                          }}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: '#9ca3af' }}>
                <span>■ 熟练(≥80)</span>
                <span>■ 一般(≥60)</span>
                <span>■ 薄弱(≥40)</span>
                <span>■ 困难(&lt;40)</span>
              </div>
            </Card>
          )}

          {/* 个人薄弱点分析（真实数据） */}
          {statData?.knowledge_points && statData.knowledge_points.length > 0 && (
            <Card title="个人薄弱点分析" style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {statData.knowledge_points.map((point, index) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 14 }}>{point.title}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        掌握度 {point.master_score ? `${(point.master_score * 100).toFixed(0)}%` : '0%'}
                      </div>
                    </div>
                    <Progress
                      percent={point.master_score ? point.master_score * 100 : 0}
                      size="small"
                      status={point.master_score < 0.5 ? 'exception' : 'active'}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* 未选择视频时的提示 */}
      {!statData && !loading && (
        <Card style={{ textAlign: 'center', padding: 40, borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 15, color: '#666' }}>请选择视频查看详细学习数据</div>
          <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>
            选择视频后可查看知识点掌握度、学习行为分析等详细报告
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default StudentData;
