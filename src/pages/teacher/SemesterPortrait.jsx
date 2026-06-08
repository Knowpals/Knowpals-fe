import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Tag, Spin, Empty, Alert, Modal, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, ExportOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import MainLayout from '../../layouts/TeacherLayout';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('semester-portrait', `
  .sp-page { background: #f8f9fa; min-height: calc(100vh - 64px - 48px); }
  .sp-content { padding: 16px 24px; max-width: 1400px; margin: 0 auto; }
  .sp-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .sp-topbar-left { display: flex; align-items: center; gap: 12px; }
  .sp-topbar-title { font-size: 20px; font-weight: 700; color: #1f2937; }
  .sp-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .sp-card-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .sp-overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
  @media (max-width: 900px) { .sp-overview-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .sp-overview-grid { grid-template-columns: 1fr; } }
  .sp-stat-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; }
  .sp-stat-value { font-size: 32px; font-weight: 700; line-height: 1.2; }
  .sp-stat-change { font-size: 13px; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 4px; }
  .sp-stat-title { font-size: 13px; color: #6b7280; margin-top: 6px; }
  .sp-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 900px) { .sp-charts-row { grid-template-columns: 1fr; } }
  .sp-dual-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 900px) { .sp-dual-row { grid-template-columns: 1fr; } }
  .sp-weak-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .sp-weak-item:last-child { border-bottom: none; }
  .sp-weak-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .sp-weak-name { font-size: 14px; font-weight: 500; color: #333; }
  .sp-weak-rate { font-size: 14px; font-weight: 700; }
  .sp-polar-item { padding: 14px; background: #fafafa; border-radius: 8px; margin-bottom: 8px; }
  .sp-polar-item:last-child { margin-bottom: 0; }
  .sp-polar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .sp-polar-name { font-size: 13px; font-weight: 500; }
  .sp-polar-gap { font-size: 14px; font-weight: 700; color: #ef4444; }
  .sp-polar-bars { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; font-size: 11px; }
  .sp-polar-bar-wrap { flex: 1; height: 14px; background: #e5e5e5; border-radius: 7px; overflow: hidden; position: relative; }
  .sp-polar-bar-fill { height: 100%; border-radius: 7px; }
  .sp-polar-scores { display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
  .sp-ai-card { background: linear-gradient(135deg, #f5f3ff, #ede9fe); border: 1px solid #c4b5fd; border-left: 4px solid #7c3aed; }
  .sp-ai-summary { font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 14px; }
  .sp-ai-priority { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
  .sp-ai-materials { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .sp-heatmap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .sp-heatmap-cell {
    border-radius: 10px; padding: 14px 10px; text-align: center; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s; position: relative; min-height: 90px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .sp-heatmap-cell:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .sp-heatmap-value { font-size: 28px; font-weight: 700; }
  .sp-heatmap-topic { font-size: 11px; margin-top: 4px; line-height: 1.3; }
  .sp-heatmap-variance { position: absolute; bottom: 6px; right: 8px; font-size: 14px; }
  .sp-heatmap-border-warn { border: 2px solid #f97316; }
`);

// ============ Demo Data ============
const DEMO = {
  overview: {
    avg_mastery: 68, prev_avg_mastery: 62,
    completion_rate: 0.78, prev_completion_rate: 0.73,
    weak_ratio: 0.32, prev_weak_ratio: 0.35,
    at_risk_count: 4, prev_at_risk_count: 5,
  },
  evolution: [
    { week: 1, avg_mastery: 55, grade_avg: 58 },
    { week: 2, avg_mastery: 56, grade_avg: 58 },
    { week: 3, avg_mastery: 58, grade_avg: 59 },
    { week: 4, avg_mastery: 57, grade_avg: 59 },
    { week: 5, avg_mastery: 60, grade_avg: 60 },
    { week: 6, avg_mastery: 62, grade_avg: 60 },
    { week: 7, avg_mastery: 63, grade_avg: 61 },
    { week: 8, avg_mastery: 61, grade_avg: 61 },
    { week: 9, avg_mastery: 65, grade_avg: 62 },
    { week: 10, avg_mastery: 64, grade_avg: 62 },
    { week: 11, avg_mastery: 67, grade_avg: 63 },
    { week: 12, avg_mastery: 66, grade_avg: 63 },
    { week: 13, avg_mastery: 68, grade_avg: 64 },
    { week: 14, avg_mastery: 67, grade_avg: 64 },
    { week: 15, avg_mastery: 68, grade_avg: 65 },
    { week: 16, avg_mastery: 68, grade_avg: 65 },
  ],
  teaching_events: [
    { week: 6, label: '期中考试' },
    { week: 10, label: 'Newton迭代专题补课' },
  ],
  dimensions: [
    { label: '概念理解', class_avg: 70, grade_avg: 72 },
    { label: '公式运用', class_avg: 75, grade_avg: 70 },
    { label: '算法实现', class_avg: 62, grade_avg: 65 },
    { label: '定理证明', class_avg: 50, grade_avg: 55 },
    { label: '计算精度', class_avg: 68, grade_avg: 66 },
    { label: '综合应用', class_avg: 55, grade_avg: 60 },
  ],
  heatmap: [
    { module: '插值法', topic: 'Lagrange插值', avg_mastery: 82, variance: 0.05, kp_id: 'lagrange' },
    { module: '插值法', topic: 'Newton插值', avg_mastery: 58, variance: 0.12, kp_id: 'newton_interp' },
    { module: '插值法', topic: 'Runge现象', avg_mastery: 45, variance: 0.16, kp_id: 'runge' },
    { module: '数值积分', topic: '梯形公式', avg_mastery: 85, variance: 0.03, kp_id: 'trapezoid' },
    { module: '数值积分', topic: 'Simpson公式', avg_mastery: 72, variance: 0.08, kp_id: 'simpson' },
    { module: '数值积分', topic: 'Gauss求积', avg_mastery: 38, variance: 0.22, kp_id: 'gauss_quad' },
    { module: '方程求根', topic: '二分法', avg_mastery: 88, variance: 0.02, kp_id: 'bisection' },
    { module: '方程求根', topic: 'Newton迭代', avg_mastery: 42, variance: 0.19, kp_id: 'newton_root' },
    { module: '线性方程组', topic: 'Gauss消元', avg_mastery: 80, variance: 0.06, kp_id: 'gauss_elim' },
    { module: '线性方程组', topic: 'LU分解', avg_mastery: 65, variance: 0.11, kp_id: 'lu' },
    { module: '线性方程组', topic: 'Jacobi迭代', avg_mastery: 55, variance: 0.14, kp_id: 'jacobi' },
    { module: '特征值', topic: '幂法', avg_mastery: 52, variance: 0.13, kp_id: 'power_method' },
    { module: '特征值', topic: 'QR算法', avg_mastery: 40, variance: 0.18, kp_id: 'qr_algo' },
  ],
  weak_points: [
    { kp_id: 'newton_convergence', kp_name: 'Newton迭代收敛性', weak_rate: 0.68, avg_mastery: 38, blocking_count: 4 },
    { kp_id: 'gauss_quad', kp_name: 'Gauss求积公式', weak_rate: 0.62, avg_mastery: 38, blocking_count: 2 },
    { kp_id: 'qr_algo', kp_name: 'QR算法', weak_rate: 0.60, avg_mastery: 40, blocking_count: 3 },
    { kp_id: 'newton_root', kp_name: 'Newton法求根', weak_rate: 0.58, avg_mastery: 42, blocking_count: 1 },
    { kp_id: 'runge', kp_name: 'Runge现象', weak_rate: 0.55, avg_mastery: 45, blocking_count: 0 },
    { kp_id: 'power_method', kp_name: '幂法求特征值', weak_rate: 0.48, avg_mastery: 52, blocking_count: 1 },
    { kp_id: 'jacobi', kp_name: 'Jacobi迭代', weak_rate: 0.45, avg_mastery: 55, blocking_count: 2 },
    { kp_id: 'newton_interp', kp_name: 'Newton插值', weak_rate: 0.42, avg_mastery: 58, blocking_count: 1 },
    { kp_id: 'lu', kp_name: 'LU分解', weak_rate: 0.35, avg_mastery: 65, blocking_count: 0 },
    { kp_id: 'simpson', kp_name: 'Simpson公式', weak_rate: 0.28, avg_mastery: 72, blocking_count: 0 },
  ],
  polarized_points: [
    { kp_id: 'qr_algo', kp_name: 'QR算法', variance: 0.18, high_group_avg: 92, low_group_avg: 28, gap: 64 },
    { kp_id: 'gauss_quad', kp_name: 'Gauss求积', variance: 0.22, high_group_avg: 85, low_group_avg: 22, gap: 63 },
    { kp_id: 'newton_root', kp_name: 'Newton迭代求根', variance: 0.19, high_group_avg: 88, low_group_avg: 30, gap: 58 },
    { kp_id: 'runge', kp_name: 'Runge现象', variance: 0.16, high_group_avg: 82, low_group_avg: 28, gap: 54 },
    { kp_id: 'jacobi', kp_name: 'Jacobi迭代', variance: 0.14, high_group_avg: 80, low_group_avg: 35, gap: 45 },
  ],
  at_risk_students: [
    { student_id: 'S012', student_name: '李同学', kp_id: 'gauss_quad', kp_name: 'Gauss求积公式', mastery: 22, class_avg: 58, deviation_sigma: -1.8, trend: 'declining', last_active: '2026-06-05' },
    { student_id: 'S007', student_name: '王同学', kp_id: 'qr_algo', kp_name: 'QR算法', mastery: 25, class_avg: 60, deviation_sigma: -1.6, trend: 'declining', last_active: '2026-06-03' },
    { student_id: 'S015', student_name: '张同学', kp_id: 'gauss_quad', kp_name: 'Gauss求积公式', mastery: 20, class_avg: 58, deviation_sigma: -1.7, trend: 'improving', last_active: '2026-06-07' },
    { student_id: 'S003', student_name: '赵同学', kp_id: 'newton_convergence', kp_name: 'Newton迭代收敛性', mastery: 28, class_avg: 65, deviation_sigma: -1.5, trend: 'stable', last_active: '2026-06-01' },
  ],
  ai_suggestion: {
    generatedAt: '2026-06-08 10:30',
    summary: '建议下周重点讲解 Newton 迭代收敛性分析，该知识点全班薄弱率 68%，且作为 QR 算法、非线性方程组求解等 4 个后继知识点的前置依赖，当前阻塞效应显著。',
    priorities: [
      { action: '课堂精讲', kp_name: 'Newton迭代收敛性', reason: '薄弱率68%，阻塞4个后继', duration: '20分钟' },
      { action: '分层练习', kp_name: 'QR算法', reason: '两极分化严重(差距64分)', duration: '15分钟' },
      { action: '个别辅导', kp_name: 'Gauss求积', reason: '4人低于班级均值1.5σ', duration: '课后' },
    ],
    suggested_materials: [
      { type: '视频片段', title: 'Newton法收敛性证明（8分钟）', link: '' },
      { type: '习题集', title: '迭代法收敛性专题练习（12题）', link: '' },
    ],
  },
};

// ============ Helpers ============
function heatColor(mastery) {
  if (mastery >= 80) return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
  if (mastery >= 65) return { bg: '#fef9c3', text: '#a16207', border: '#fde68a' };
  if (mastery >= 45) return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' };
  return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
}

function varianceEmoji(v) {
  if (v < 0.08) return '🟢';
  if (v < 0.14) return '🟡';
  return '🔴';
}

function trendIcon(trend) {
  if (trend === 'declining') return <ArrowDownOutlined style={{ color: '#ef4444' }} />;
  if (trend === 'improving') return <ArrowUpOutlined style={{ color: '#22c55e' }} />;
  return <MinusOutlined style={{ color: '#9ca3af' }} />;
}

function trendTag(trend) {
  const map = { declining: { text: '↓恶化', color: '#ef4444' }, improving: { text: '↑改善', color: '#22c55e' }, stable: { text: '−稳定', color: '#9ca3af' } };
  const t = map[trend] || map.stable;
  return <Tag color={t.color}>{t.text}</Tag>;
}

// ============ Main Component ============
export default function SemesterPortrait() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [loading] = useState(false);
  const [data] = useState(DEMO);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKp, setModalKp] = useState(null);
  const [riskFilter, setRiskFilter] = useState('all');

  const openKpModal = (kp) => { setModalKp(kp); setModalOpen(true); };

  // --- Stat Card ---
  function StatCard({ title, value, prevValue, change, unit, color, goodDirection }) {
    const isUp = change > 0;
    const isGood = goodDirection === 'down' ? !isUp : isUp;
    return (
      <div className="sp-stat-card">
        <div className="sp-stat-value" style={{ color }}>{value}<span style={{ fontSize: 16 }}>{unit}</span></div>
        <div className="sp-stat-change" style={{ color: isGood ? '#22c55e' : '#ef4444' }}>
          {isUp ? <ArrowUpOutlined /> : change < 0 ? <ArrowDownOutlined /> : <MinusOutlined />}
          {change > 0 ? `↑ +${change}` : change < 0 ? `↓ ${change}` : '− 0'}{unit}
          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>vs 期中</span>
        </div>
        <div className="sp-stat-title">{title}</div>
      </div>
    );
  }

  // --- Evolution Chart ---
  const evolutionOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['班级平均', '年级基准'], bottom: 0 },
    grid: { top: 30, left: 8, right: 8, bottom: 30, containLabel: true },
    xAxis: { type: 'category', data: data.evolution.map(e => `第${e.week}周`), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10, formatter: '{value}' } },
    series: [
      {
        name: '班级平均', type: 'line', data: data.evolution.map(e => e.avg_mastery), smooth: true,
        lineStyle: { color: '#7c3aed', width: 2.5 }, itemStyle: { color: '#7c3aed' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(124,58,237,0.2)' }, { offset: 1, color: 'rgba(124,58,237,0.02)' }] } },
        markLine: { silent: true, symbol: 'none', data: data.teaching_events.map(te => ({ xAxis: `第${te.week}周`, label: { formatter: te.label, fontSize: 9, position: 'insideStartTop', distance: 4 }, lineStyle: { color: '#f59e0b', type: 'dashed' } })) },
      },
      {
        name: '年级基准', type: 'line', data: data.evolution.map(e => e.grade_avg), smooth: true,
        lineStyle: { color: '#9ca3af', type: 'dashed', width: 1.5 }, itemStyle: { color: '#9ca3af' }, areaStyle: { opacity: 0 },
      },
    ],
    color: ['#7c3aed', '#9ca3af'],
  };

  // --- Radar Chart ---
  const radarOption = {
    radar: {
      center: ['50%', '55%'], radius: '65%',
      indicator: data.dimensions.map(d => ({ name: d.label, max: 100 })),
      axisName: { fontSize: 10, color: '#666' },
    },
    series: [
      { type: 'radar', name: '班级均值',
        data: [{ value: data.dimensions.map(d => d.class_avg), name: '班级均值', areaStyle: { color: 'rgba(124,58,237,0.15)' }, lineStyle: { color: '#7c3aed', width: 2 }, itemStyle: { color: '#7c3aed' } }],
        symbol: 'circle', symbolSize: 6,
      },
      { type: 'radar', name: '年级基准',
        data: [{ value: data.dimensions.map(d => d.grade_avg), name: '年级基准', areaStyle: { opacity: 0 }, lineStyle: { color: '#9ca3af', type: 'dashed' }, itemStyle: { color: '#9ca3af' } }],
        symbol: 'none',
      },
    ],
    color: ['#7c3aed', '#9ca3af'],
  };

  // radar insight text
  const strengths = data.dimensions.filter(d => d.class_avg > d.grade_avg);
  const weaknesses = data.dimensions.filter(d => d.class_avg < d.grade_avg);
  const radarInsight = data.dimensions.length > 0
    ? `班级在**${strengths[0]?.label || '—'}**维度表现突出（+${strengths[0]?.class_avg - strengths[0]?.grade_avg || 0} vs 年级），**${weaknesses[0]?.label || '—'}**是主要短板（${weaknesses[0]?.class_avg - weaknesses[0]?.grade_avg || 0} vs 年级）。`
    : '';

  // --- Risk filter ---
  const filteredAtRisk = data.at_risk_students.filter(s => {
    if (riskFilter === 'declining') return s.trend === 'declining';
    if (riskFilter === 'new') return s.trend === 'stable';
    if (riskFilter === 'improved') return s.trend === 'improving';
    return true;
  });

  // --- At-Risk Table Columns ---
  const riskColumns = [
    { title: '学生', dataIndex: 'student_name', key: 'name', width: 80 },
    { title: '异常知识点', dataIndex: 'kp_name', key: 'kp', width: 140 },
    { title: '掌握度', dataIndex: 'mastery', key: 'mastery', width: 70, render: (v) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{v}</span> },
    { title: '班级均值', dataIndex: 'class_avg', key: 'avg', width: 70 },
    { title: '偏差(σ)', dataIndex: 'deviation_sigma', key: 'dev', width: 70, render: (v) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{v}σ</span> },
    { title: '趋势', dataIndex: 'trend', key: 'trend', width: 80, render: (v) => trendTag(v) },
    { title: '最后活跃', dataIndex: 'last_active', key: 'active', width: 90, render: (v) => <span style={{ fontSize: 12, color: '#9ca3af' }}>{v}</span> },
    { title: '操作', key: 'action', width: 140, render: (_, r) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <Button size="small" type="link" onClick={() => navigate(`/student-data/${r.student_id}`)}>查看详情</Button>
        <Button size="small" type="link" style={{ color: '#ef4444' }}>推送补救</Button>
      </div>
    )},
  ];

  // loading / empty states
  if (loading) return <MainLayout pageTitle="课程学期画像" showBack><div style={{ textAlign: 'center', padding: 120 }}><Spin size="large" tip="正在汇总学期数据..." /></div></MainLayout>;
  if (!data) return (
    <MainLayout pageTitle="课程学期画像" showBack>
      <div style={{ padding: 24 }}>
        <Card style={{ textAlign: 'center', padding: 60, borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>暂无学期数据</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>请先发布视频任务并等待学生完成学习后查看</div>
          <Button type="primary" onClick={() => navigate('/video-management')}>去发布视频</Button>
        </Card>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout pageTitle={`课程学期画像 · 数值分析(${classId || 2})班`} showBack>
      <div className="sp-page">
        <div className="sp-content">

          {/* ====== 1. Overview Cards ====== */}
          <div className="sp-overview-grid">
            <StatCard title="综合掌握度评分" value={data.overview.avg_mastery} prevValue={data.overview.prev_avg_mastery} change={data.overview.avg_mastery - data.overview.prev_avg_mastery} unit="分" color="#7c3aed" />
            <StatCard title="预习完成覆盖率" value={Math.round(data.overview.completion_rate * 100)} prevValue={Math.round(data.overview.prev_completion_rate * 100)} change={Math.round((data.overview.completion_rate - data.overview.prev_completion_rate) * 100)} unit="%" color="#22c55e" />
            <StatCard title="薄弱知识点占比" value={Math.round(data.overview.weak_ratio * 100)} prevValue={Math.round(data.overview.prev_weak_ratio * 100)} change={Math.round((data.overview.weak_ratio - data.overview.prev_weak_ratio) * 100)} unit="%" color="#f59e0b" goodDirection="down" />
            <StatCard title="异常个体预警" value={data.overview.at_risk_count} prevValue={data.overview.prev_at_risk_count} change={data.overview.at_risk_count - data.overview.prev_at_risk_count} unit="人" color="#ef4444" goodDirection="down" />
          </div>

          {/* ====== 2. Charts Row ====== */}
          <div className="sp-charts-row">
            <div className="sp-card">
              <div className="sp-card-title">📈 班级掌握度演化</div>
              <ReactECharts option={evolutionOption} style={{ height: 280 }} notMerge />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                虚线 = 年级基准 · 黄色虚线 = 教学事件
              </div>
            </div>
            <div className="sp-card">
              <div className="sp-card-title">🎯 六维能力雷达</div>
              <ReactECharts option={radarOption} style={{ height: 280 }} notMerge />
              <div style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.5 }}>{radarInsight}</div>
            </div>
          </div>

          {/* ====== 3. Heatmap ====== */}
          <div className="sp-card">
            <div className="sp-card-title">🗺️ 班级知识点掌握度热力图</div>
            <div className="sp-heatmap-grid">
              {data.heatmap.map((cell) => {
                const c = heatColor(cell.avg_mastery);
                const isWarn = cell.variance >= 0.14 && cell.avg_mastery < 60;
                return (
                  <div
                    key={cell.kp_id}
                    className={`sp-heatmap-cell ${isWarn ? 'sp-heatmap-border-warn' : ''}`}
                    style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
                    onClick={() => openKpModal(cell)}
                  >
                    <div className="sp-heatmap-value" style={{ color: c.text }}>{cell.avg_mastery}</div>
                    <div className="sp-heatmap-topic" style={{ color: c.text }}>{cell.topic}</div>
                    <div className="sp-heatmap-variance">{varianceEmoji(cell.variance)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 14, fontSize: 11, color: '#9ca3af' }}>
              <span>🟢 低方差（一致）</span><span>🟡 中方差</span><span>🔴 高方差（两极分化）</span>
              <span style={{ color: '#f97316', fontWeight: 500 }}>橙色边框 = 高方差+低掌握，需重点关注</span>
            </div>
          </div>

          {/* ====== 4. Dual Lists ====== */}
          <div className="sp-dual-row">
            {/* Weak Points TOP 10 */}
            <div className="sp-card">
              <div className="sp-card-title">⚠️ 共性薄弱点 TOP 10</div>
              {data.weak_points.map((wp, idx) => (
                <div key={wp.kp_id} className="sp-weak-item">
                  <div className="sp-weak-header">
                    <span className="sp-weak-name">{idx + 1}. {wp.kp_name}</span>
                    <span className="sp-weak-rate" style={{ color: wp.weak_rate > 0.5 ? '#ef4444' : '#f59e0b' }}>薄弱率 {(wp.weak_rate * 100).toFixed(0)}%</span>
                  </div>
                  <Progress percent={Math.round(wp.weak_rate * 100)} size="small" strokeColor={wp.weak_rate > 0.5 ? '#ef4444' : '#f59e0b'} format={() => `avg ${wp.avg_mastery}分`} />
                  {wp.blocking_count >= 2 && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                      <WarningOutlined /> 阻塞 {wp.blocking_count} 个后继知识点
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Polarized TOP 5 */}
            <div className="sp-card">
              <div className="sp-card-title">📊 两极分化预警 TOP 5</div>
              {data.polarized_points.map((pp) => (
                <div key={pp.kp_id} className="sp-polar-item">
                  <div className="sp-polar-header">
                    <span className="sp-polar-name">{pp.kp_name}</span>
                    <span className="sp-polar-gap">差距 {pp.gap} 分</span>
                  </div>
                  <div className="sp-polar-bars">
                    <span style={{ width: 36, color: '#10b981', fontWeight: 600 }}>前25%</span>
                    <div className="sp-polar-bar-wrap">
                      <div className="sp-polar-bar-fill" style={{ width: `${pp.high_group_avg}%`, background: '#10b981' }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#10b981', width: 24, textAlign: 'right' }}>{pp.high_group_avg}</span>
                  </div>
                  <div className="sp-polar-bars">
                    <span style={{ width: 36, color: '#ef4444', fontWeight: 600 }}>后25%</span>
                    <div className="sp-polar-bar-wrap">
                      <div className="sp-polar-bar-fill" style={{ width: `${pp.low_group_avg}%`, background: '#ef4444' }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#ef4444', width: 24, textAlign: 'right' }}>{pp.low_group_avg}</span>
                  </div>
                  <div className="sp-polar-scores">
                    <span>建议分层教学</span>
                    <span>方差 {pp.variance.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ====== 5. At-Risk Table ====== */}
          <div className="sp-card">
            <div className="sp-card-title">⚠️ 异常个体预警</div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              {['all', 'declining', 'new', 'improved'].map(key => (
                <Button key={key} size="small" type={riskFilter === key ? 'primary' : 'default'} onClick={() => setRiskFilter(key)}>
                  {key === 'all' ? '全部' : key === 'declining' ? '持续恶化' : key === 'new' ? '新出现' : '已改善'}
                </Button>
              ))}
            </div>
            <Table columns={riskColumns} dataSource={filteredAtRisk} rowKey="student_id" pagination={false} size="small" />
          </div>

          {/* ====== 6. AI Suggestion ====== */}
          <div className="sp-card sp-ai-card">
            <div className="sp-card-title" style={{ color: '#7c3aed' }}>🤖 AI 课堂教学建议</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>基于全学期数据分析自动生成 · 生成时间 {data.ai_suggestion.generatedAt}</div>
            <div className="sp-ai-summary">{data.ai_suggestion.summary}</div>
            {data.ai_suggestion.priorities.map((p, idx) => (
              <div key={idx} className="sp-ai-priority">
                <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: 14, minWidth: 24 }}>{idx + 1}.</span>
                <Tag color={p.action === '课堂精讲' ? 'purple' : p.action === '分层练习' ? 'orange' : 'blue'}>{p.action}</Tag>
                <span style={{ fontSize: 13, color: '#333' }}><b>{p.kp_name}</b> — {p.reason}</span>
                <Tag>{p.duration}</Tag>
              </div>
            ))}
            <div className="sp-ai-materials">
              {data.ai_suggestion.suggested_materials.map((m, idx) => (
                <Tag key={idx} color="default" style={{ cursor: 'pointer', padding: '4px 10px' }}>{m.type === '视频片段' ? '🎬' : '📝'} {m.title}</Tag>
              ))}
            </div>
          </div>

          {/* ====== KnowledgePoint Modal ====== */}
          <Modal
            title={modalKp ? `${modalKp.topic} — 班级详情` : ''}
            open={modalOpen}
            onCancel={() => setModalOpen(false)}
            footer={null}
            width={600}
          >
            {modalKp && (
              <div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: heatColor(modalKp.avg_mastery).text }}>{modalKp.avg_mastery}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>班级平均掌握度</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: modalKp.variance >= 0.14 ? '#ef4444' : '#22c55e' }}>{modalKp.variance.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>方差 {varianceEmoji(modalKp.variance)}</div>
                  </div>
                </div>
                <Alert
                  type={modalKp.variance >= 0.14 ? 'warning' : 'info'}
                  message={modalKp.variance >= 0.14 ? '该知识点存在明显两极分化，建议分层教学' : '该知识点班级掌握度较一致'}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="link" onClick={() => navigate(`/analysis-video/${modalKp.kp_id}`)}>查看关联视频</Button>
                  <Button type="link" style={{ color: '#ef4444' }}>查看薄弱学生名单</Button>
                </div>
              </div>
            )}
          </Modal>

        </div>
      </div>
    </MainLayout>
  );
}
