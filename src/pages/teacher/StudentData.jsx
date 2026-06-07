import { useState, useEffect } from 'react';
import { Form, Select, Card, Progress, Tag, Spin, Row, Col } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/TeacherLayout';
import { getStudentStat, getVideoTasks, getStudentOverview } from '../../services/teacherApi';

const { Option } = Select;

// 学生画像 demo 数据（后端 API 未就绪时兜底）
const demoPersona = {
  name: '张同学',
  email: 'zhang@example.com',
  school: '某大学',
  major: '计算机科学',
  learning_style: '视觉型',
  strengths: ['计算能力突出', '逻辑推理强', '概念理解快'],
  weaknesses: ['应用创新能力待提升', '数值实验经验少'],
  dimensions: [
    { label: '计算能力', value: 85, color: '#7c3aed' },
    { label: '逻辑推理', value: 72, color: '#7c3aed' },
    { label: '知识记忆', value: 60, color: '#f59e0b' },
    { label: '应用创新', value: 45, color: '#ef4444' },
  ],
  chapters: [
    { name: '插值法', kps: ['概念', 'Lagrange', 'Newton', 'Hermite', '分段', '样条'], scores: [90, 85, 68, 55, 60, 45] },
    { name: '数值积分', kps: ['梯形', 'Simpson', '复化', 'Romberg', 'Gauss'], scores: [80, 75, 65, 50, 48] },
    { name: '方程求根', kps: ['二分', '迭代', 'Newton', '弦截', '收敛性'], scores: [88, 65, 72, 60, 55] },
    { name: '线性方程组', kps: ['Gauss', 'LU', 'Cholesky', 'Jacobi', 'GS', 'SOR'], scores: [85, 70, 60, 55, 50, 40] },
    { name: '特征值', kps: ['幂法', '反幂', 'QR', 'Householder'], scores: [52, 45, 35, 30] },
  ],
  behavior: {
    peak_hours: '晚上 19:00-22:00',
    avg_session_min: 45,
    answer_speed: '中等偏快',
    review_rate: '35%',
  },
  suggestion: '该生计算基础扎实，建议加强数值分析理论证明和编程实现能力的训练。重点关注 Gauss 型积分和特征值的数值方法，可引导学生用 Python 实现算法加深理解。',
  learning_path: [
    '巩固插值法基础（Lagrange → Newton → Hermite）',
    '深入数值积分理论（从 Newton-Cotes 到 Gauss 积分）',
    '掌握方程求根各方法收敛性分析',
    '系统学习线性方程组迭代法',
    '逐步攻克特征值数值方法',
  ],
};

function heatColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

const StudentData = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [statData, setStatData] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [personaData, setPersonaData] = useState(null);
  const [personaLoading, setPersonaLoading] = useState(true);

  // 获取学生画像
  useEffect(() => {
    fetchPersona();
  }, [studentId]);

  // 获取班级视频列表
  useEffect(() => {
    fetchVideos();
  }, []);

  // 当选择的视频变化时，获取该视频的统计数据
  useEffect(() => {
    if (selectedVideo) {
      fetchVideoStat(selectedVideo);
    } else {
      setStatData(null);
    }
  }, [selectedVideo]);

  const fetchPersona = async () => {
    setPersonaLoading(true);
    try {
      const res = await getStudentOverview();
      if ((res.code === 0 || res.code === 200) && res.data) {
        // 接口返回: correct_rate, finished_count, total_count, total_watch_time_sec
        // 合并真实数据到画像，丰富维度信息仍用 demo 兜底
        setPersonaData({
          ...demoPersona,
          overview: res.data,
        });
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setPersonaData({ ...demoPersona, overview: null });
    setPersonaLoading(false);
  };

  const fetchVideos = async () => {
    setVideoLoading(true);
    try {
      // TODO: 需要后端API支持获取学生的班级列表
      // 暂时使用第一个班级ID，后续需要根据学生所在的班级获取
      const res = await getVideoTasks(1);
      setVideos(res.data.video_tasks || []);
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
            >
              {videos.map((v) => (
                <Option key={v.video_id} value={v.video_id}>
                  {v.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </div>

      {/* 学生画像 */}
      {!personaLoading && personaData && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧑‍🎓</span>
              <span>学生画像</span>
            </div>
          }
          style={{ marginBottom: 24, borderRadius: 12 }}
          headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        >
          {/* 基本信息 + 标签 */}
          <Row gutter={24} style={{ marginBottom: 20 }}>
            <Col flex="auto">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 22, fontWeight: 600, flexShrink: 0,
                }}>
                  {personaData.name?.charAt(0) || '学'}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#1f2937' }}>{personaData.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{personaData.email}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {personaData.school}{personaData.major ? ` · ${personaData.major}` : ''}
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <Tag color="purple" style={{ borderRadius: 12, padding: '2px 12px' }}>
              学习风格: {personaData.learning_style}
            </Tag>
            {personaData.strengths?.map(s => (
              <Tag key={s} color="green" style={{ borderRadius: 12, padding: '2px 12px' }}>强项: {s}</Tag>
            ))}
            {personaData.weaknesses?.map(w => (
              <Tag key={w} color="orange" style={{ borderRadius: 12, padding: '2px 12px' }}>弱项: {w}</Tag>
            ))}
          </div>

          {/* 学情概览（接口真实数据） */}
          {personaData.overview && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#f5f3ff', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>
                    {personaData.overview.total_watch_time_sec != null
                      ? `${Math.floor(personaData.overview.total_watch_time_sec / 60)}min`
                      : '-'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>总学习时长</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#ecfdf5', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>
                    {personaData.overview.correct_rate != null
                      ? `${(personaData.overview.correct_rate * 100).toFixed(0)}%`
                      : '-'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>正确率</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#eff6ff', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>
                    {personaData.overview.finished_count ?? '-'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>已完成</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#fff7ed', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#f97316' }}>
                    {personaData.overview.total_count ?? '-'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>总任务数</div>
                </div>
              </Col>
            </Row>
          )}

          {/* 能力维度 */}
          <Card
            type="inner"
            title="能力维度"
            size="small"
            style={{ marginBottom: 16 }}
            headStyle={{ fontSize: 14, fontWeight: 600 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {personaData.dimensions?.map(dim => (
                <div key={dim.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 70, fontSize: 13, color: '#6b7280', textAlign: 'right' }}>{dim.label}</span>
                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${dim.value}%`,
                      background: dim.color || (dim.value >= 80 ? '#10b981' : dim.value >= 60 ? '#f59e0b' : dim.value >= 40 ? '#f97316' : '#ef4444'),
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span style={{ width: 36, fontSize: 12, fontWeight: 600, color: '#333' }}>{dim.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 知识点掌握热力图 */}
          {personaData.chapters && personaData.chapters.length > 0 && (
            <Card
              type="inner"
              title="知识点掌握度"
              size="small"
              style={{ marginBottom: 16 }}
              headStyle={{ fontSize: 14, fontWeight: 600 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {personaData.chapters.map((ch, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 80, fontSize: 12, color: '#6b7280', flexShrink: 0, textAlign: 'right' }}>
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

          {/* 学习行为 + 教学建议 并排 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {personaData.behavior && (
              <Col xs={24} md={12}>
                <Card
                  type="inner"
                  title="学习行为分析"
                  size="small"
                  headStyle={{ fontSize: 14, fontWeight: 600 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>学习高峰时段</span>
                      <span style={{ fontWeight: 500 }}>{personaData.behavior.peak_hours}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>平均单次学习时长</span>
                      <span style={{ fontWeight: 500 }}>{personaData.behavior.avg_session_min} 分钟</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>答题速度</span>
                      <span style={{ fontWeight: 500 }}>{personaData.behavior.answer_speed}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>复习回顾率</span>
                      <span style={{ fontWeight: 500 }}>{personaData.behavior.review_rate}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            )}
            {personaData.suggestion && (
              <Col xs={24} md={personaData.behavior ? 12 : 24}>
                <Card
                  type="inner"
                  title="教学建议"
                  size="small"
                  headStyle={{ fontSize: 14, fontWeight: 600 }}
                >
                  <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>
                    💡 {personaData.suggestion}
                  </div>
                </Card>
              </Col>
            )}
          </Row>

          {/* 推荐学习路径 */}
          {personaData.learning_path && personaData.learning_path.length > 0 && (
            <Card
              type="inner"
              title="推荐学习路径"
              size="small"
              headStyle={{ fontSize: 14, fontWeight: 600 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {personaData.learning_path.map((step, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: '#f8f9fa', borderRadius: 8, fontSize: 13,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#7c3aed', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Card>
      )}

      {/* 学生画像加载中 */}
      {personaLoading && (
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: 24 }}>
          <Spin />
          <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>加载学生画像中...</div>
        </Card>
      )}

      {/* 核心数据卡片 */}
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

      {/* 个人薄弱点分析 */}
      {statData?.knowledge_points && statData.knowledge_points.length > 0 && (
        <Card title="个人薄弱点分析">
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

      {/* 默认薄弱点显示 - 当没有选择视频时 */}
      {!statData && (
        <Card title="知识易错点TOP 3" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>一元二次方程求根公式</div>
                <div style={{ fontSize: 12, color: '#666' }}>作业错误 3次 / 练习错误 2次</div>
              </div>
              <Tag color="red">错误率 60%</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>函数图像的性质</div>
                <div style={{ fontSize: 12, color: '#666' }}>作业错误 2次 / 练习错误 1次</div>
              </div>
              <Tag color="orange">错误率 35%</Tag>
            </div>
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default StudentData;
