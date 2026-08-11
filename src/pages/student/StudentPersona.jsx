import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import * as echarts from 'echarts';
import BackArrow from '../../components/BackArrow';
import { getStudentPersona } from '../../services/studentApi';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';
import '../../utils/sharedPageStyles';

injectStyles('student-persona', `
  .persona-page-v2 { min-height: 100vh; background: #f8f9fa; }
  .persona-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 20px 15px; color: #fff;
    border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(124,58,237,0.3);
  }
  .persona-header-content-v2 { display: flex; align-items: center; gap: 12px; }
  .persona-back-btn-v2 { font-size: 22px; color: #fff; cursor: pointer; width: 30px; text-align: center; }
  .persona-header-title-v2 { font-size: 18px; font-weight: 600; }
  .persona-content-v2 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .persona-content-v2 { max-width: 1200px; padding: 16px 32px; } }
  .persona-section-v2 {
    background: #fff; border-radius: 12px; padding: 16px;
    margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .persona-section-title-v2 { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; }
  .persona-profile-v2 { display: flex; align-items: center; gap: 12px; }
  .persona-avatar-v2 {
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 24px; font-weight: 600; flex-shrink: 0;
  }
  .persona-info-v2 { display: flex; flex-direction: column; gap: 2px; }
  .persona-name-v2 { font-size: 17px; font-weight: 600; color: #333; }
  .persona-meta-v2 { font-size: 12px; color: #999; }
  .persona-tags-v2 { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .persona-tag-v2 {
    padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 500;
  }
  .persona-tag-v2.style { background: #ede9fe; color: #7c3aed; }
  .persona-tag-v2.strength { background: #d1fae5; color: #059669; }
  .persona-tag-v2.weakness { background: #fef3c7; color: #d97706; }
  .persona-radar-v2 { display: flex; flex-direction: column; gap: 10px; }
  .persona-radar-item-v2 { display: flex; align-items: center; gap: 10px; }
  .persona-radar-label-v2 { width: 60px; font-size: 12px; color: #6b7280; text-align: right; }
  .persona-radar-bar-v2 { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .persona-radar-fill-v2 { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .persona-radar-value-v2 { width: 40px; font-size: 12px; font-weight: 600; color: #333; }
  .persona-heatmap-v2 { display: flex; flex-direction: column; gap: 8px; }
  .persona-heatmap-row-v2 { display: flex; align-items: center; gap: 10px; }
  .persona-heatmap-label-v2 { width: 80px; font-size: 12px; color: #6b7280; }
  .persona-heatmap-cells-v2 { display: flex; gap: 4px; flex: 1; }
  .persona-heatmap-cell-v2 {
    width: 24px; height: 24px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: #fff; font-weight: 600;
  }
  .persona-behavior-v2 { display: flex; flex-direction: column; gap: 8px; }
  .persona-behavior-item-v2 { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
  .persona-behavior-label-v2 { color: #6b7280; }
  .persona-behavior-value-v2 { color: #333; font-weight: 500; }
  .persona-radar-chart { width: 100%; height: 320px; }
  .persona-suggestion-v2 { font-size: 13px; color: #666; line-height: 1.6; }

  /* V5 热力图 */
  .persona-hm-container-v5 { overflow-x: auto; }
  .persona-hm-table-v5 { border-collapse: collapse; width: 100%; min-width: 700px; }
  .persona-hm-th-v5 {
    padding: 6px 4px; font-size: 11px; font-weight: 600; color: #555;
    text-align: center; background: #fafafa; border: 1px solid #f0f0f0;
    position: sticky; top: 0; z-index: 1;
    white-space: nowrap;
  }
  .persona-hm-td-v5 {
    padding: 0; border: 1px solid #f0f0f0; text-align: center;
    cursor: pointer; transition: transform 0.1s, box-shadow 0.1s;
    position: relative;
  }
  .persona-hm-td-v5:hover {
    transform: scale(1.08); box-shadow: 0 2px 10px rgba(0,0,0,0.15); z-index: 2;
  }
  .persona-hm-cell-inner-v5 {
    padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  }
  .persona-hm-topic-v5 { font-size: 11px; font-weight: 500; color: #333; }
  .persona-hm-score-v5 { font-size: 14px; font-weight: 700; }
  .persona-hm-module-label-v5 {
    font-size: 11px; font-weight: 600; color: #555; padding: 6px;
    white-space: nowrap; background: #fafafa; border: 1px solid #f0f0f0;
    text-align: right;
  }
  .persona-hm-legend-v5 { display: flex; gap: 16px; align-items: center; margin-top: 12px; font-size: 11px; }
  .persona-hm-legend-item-v5 { display: flex; align-items: center; gap: 4px; }
  .persona-hm-legend-swatch-v5 { width: 14px; height: 14px; border-radius: 3px; }
  .persona-path-v2 { display: flex; flex-direction: column; gap: 6px; }
  .persona-path-item-v2 {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    background: #f8f9fa; border-radius: 8px; font-size: 13px;
  }
  .persona-path-num-v2 {
    width: 22px; height: 22px; border-radius: 50%;
    background: #7c3aed; color: #fff; display: flex;
    align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; flex-shrink: 0;
  }
  .persona-footer-v2 { display: flex; gap: 12px; margin-top: 4px; }
  .persona-footer-btn-v2 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
    background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff;
  }
`);

const demoPersona = {
  name: '张同学',
  email: 'zhang2024@mails.ccnu.edu.cn',
  school: '华中师范大学',
  major: '计算机科学与技术',
  learning_style: '视觉型',
  strengths: ['多项式计算能力强', '导数/微分基础扎实', '直观概念理解快'],
  weaknesses: ['迭代收敛性分析弱', '理论证明能力待提升', '综合应用信心不足'],
  // V5 六维能力雷达（每个维度 = 该维度下所有关联知识点的 mastery 估算均值）
  dimensions: [
    { label: '概念理解', value: 78, classAvg: 70, desc: '插值/逼近/误差等核心概念的记忆与复述', kpCoverage: 12 },
    { label: '公式运用', value: 82, classAvg: 72, desc: 'Lagrange/Newton/Gauss 等公式的代入计算', kpCoverage: 15 },
    { label: '算法实现', value: 65, classAvg: 60, desc: '消元/迭代/分解等算法的步骤执行与编程', kpCoverage: 10 },
    { label: '定理证明', value: 48, classAvg: 55, desc: '收敛性/误差界/代数精度等定理的推导', kpCoverage: 8 },
    { label: '计算精度', value: 70, classAvg: 65, desc: '舍入误差/截断误差/数值稳定性的判断', kpCoverage: 6 },
    { label: '综合应用', value: 55, classAvg: 58, desc: '多方法选型/跨知识点融合/实际问题建模', kpCoverage: 5 },
  ],
  // V5 知识点掌握热力图：Module × Topic
  heatmap: {
    modules: ['插值法', '数值积分', '方程求根', '线性方程组', '特征值'],
    rows: [
      // 插值法 Module
      { module: '插值法', topic: '插值概念', mastery: 90, kpId: 'interp_intro' },
      { module: '插值法', topic: 'Lagrange插值', mastery: 85, kpId: 'lagrange' },
      { module: '插值法', topic: 'Newton插值', mastery: 68, kpId: 'newton_interp' },
      { module: '插值法', topic: 'Hermite插值', mastery: 55, kpId: 'hermite' },
      { module: '插值法', topic: '分段插值', mastery: 62, kpId: 'piecewise' },
      { module: '插值法', topic: '样条插值', mastery: 45, kpId: 'spline' },
      { module: '插值法', topic: 'Runge现象', mastery: 58, kpId: 'runge' },
      // 数值积分 Module
      { module: '数值积分', topic: '梯形公式', mastery: 82, kpId: 'trapezoid' },
      { module: '数值积分', topic: 'Simpson公式', mastery: 76, kpId: 'simpson' },
      { module: '数值积分', topic: '复化求积', mastery: 65, kpId: 'composite' },
      { module: '数值积分', topic: 'Romberg外推', mastery: 50, kpId: 'romberg' },
      { module: '数值积分', topic: 'Gauss求积', mastery: 42, kpId: 'gauss_quad' },
      { module: '数值积分', topic: '代数精度', mastery: 60, kpId: 'alg_precision' },
      // 方程求根 Module
      { module: '方程求根', topic: '二分法', mastery: 88, kpId: 'bisection' },
      { module: '方程求根', topic: '不动点迭代', mastery: 62, kpId: 'fixed_point' },
      { module: '方程求根', topic: 'Newton法', mastery: 55, kpId: 'newton_root' },
      { module: '方程求根', topic: '弦截法', mastery: 60, kpId: 'secant' },
      { module: '方程求根', topic: '收敛性分析', mastery: 48, kpId: 'root_convergence' },
      // 线性方程组 Module
      { module: '线性方程组', topic: 'Gauss消元', mastery: 85, kpId: 'gauss_elim' },
      { module: '线性方程组', topic: 'LU分解', mastery: 72, kpId: 'lu_decomp' },
      { module: '线性方程组', topic: 'Cholesky分解', mastery: 58, kpId: 'cholesky' },
      { module: '线性方程组', topic: 'Jacobi迭代', mastery: 52, kpId: 'jacobi_iter' },
      { module: '线性方程组', topic: 'Gauss-Seidel', mastery: 48, kpId: 'gs_iter' },
      { module: '线性方程组', topic: 'SOR方法', mastery: 38, kpId: 'sor' },
      // 特征值 Module
      { module: '特征值', topic: '幂法', mastery: 52, kpId: 'power_method' },
      { module: '特征值', topic: '反幂法', mastery: 45, kpId: 'inverse_power' },
      { module: '特征值', topic: 'QR算法', mastery: 35, kpId: 'qr_algo' },
      { module: '特征值', topic: 'Householder', mastery: 30, kpId: 'householder' },
      { module: '特征值', topic: 'Givens变换', mastery: 28, kpId: 'givens' },
    ],
  },
  overall_mastery: 59,
  class_avg_mastery: 62,
  behavior: {
    peak_hours: '晚上 19:00-22:00',
    avg_session_min: 45,
    total_study_hours: 24.5,
    answer_speed: '中等偏快（平均 42s/题）',
    review_rate: '35%',
    pause_frequency: '每10分钟 1.2 次',
    completion_rate: '78%',
  },
  suggestion: '你的概念理解和公式运用能力较好（78%/82%），但定理证明（48%）和综合应用（55%）是明显的短板。热力图中红色区域（Gauss求积 42%、SOR 38%、QR算法 35%）需要优先加固。建议：① 从 Lagrange 插值推导入手，逐步理解 Gauss 积分的高精度原理；② 结合 Jacobi/GS 迭代对比，理解 SOR 松弛因子的作用；③ 尝试手算一个小矩阵的 QR 分解（2×2）建立直观认识。',
  learning_path: [
    '📌 优先：Gauss 求积（42%）→ 回顾正交多项式与 Legendre 多项式',
    '📌 优先：SOR 方法（38%）→ 从 Jacobi/GS 收敛域对比入手',
    '📌 优先：QR 算法（35%）→ 先巩固 Householder 变换的几何意义',
    '🔧 加强：Newton 迭代收敛性（48%）→ 用 Taylor 展开推导二阶收敛',
    '🔧 加强：Hermite 插值（55%）→ 对比 Lagrange 插值理解导数条件',
    '📈 拓展：特征值问题综合 → 选做 3 道跨方法对比题',
  ],
};

export default function StudentPersona() {
  const navigate = useNavigate();
  const radarRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState(null);

  useEffect(() => { loadPersona(); }, []);

  // 雷达图（V5：双系列对比 + 面积/形状说明）
  useEffect(() => {
    if (!radarRef.current || !persona?.dimensions) return;
    const inst = echarts.init(radarRef.current);
    const dims = persona.dimensions;
    inst.setOption({
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: ['你的能力', '班级平均'],
        bottom: 0,
        textStyle: { fontSize: 11 },
      },
      radar: {
        center: ['50%', '48%'],
        radius: '62%',
        indicator: dims.map(d => ({
          name: `${d.label}\n(${d.value}分)`,
          max: 100,
        })),
        axisName: {
          fontSize: 10, color: '#555',
          formatter: (name) => name,
        },
        splitArea: {
          areaStyle: { color: ['#fff', '#f8f9fa', '#fff', '#f8f9fa', '#fff'] },
        },
        splitLine: { lineStyle: { color: '#e5e5e5' } },
        axisLine: { lineStyle: { color: '#d4d4d4' } },
      },
      series: [
        {
          type: 'radar',
          name: '你的能力',
          data: [{
            value: dims.map(d => d.value),
            name: '你的能力',
            areaStyle: { color: 'rgba(124,58,237,0.2)' },
            lineStyle: { color: '#7c3aed', width: 2.5 },
            itemStyle: { color: '#7c3aed', borderColor: '#fff', borderWidth: 2 },
            symbol: 'circle',
            symbolSize: 7,
          }],
        },
        {
          type: 'radar',
          name: '班级平均',
          data: [{
            value: dims.map(d => d.classAvg),
            name: '班级平均',
            areaStyle: { color: 'rgba(156,163,175,0.08)' },
            lineStyle: { color: '#9ca3af', width: 1.5, type: 'dashed' },
            itemStyle: { color: '#9ca3af' },
            symbol: 'diamond',
            symbolSize: 5,
          }],
        },
      ],
    });
    const onResize = () => inst.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); inst.dispose(); };
  }, [persona]);

  // 计算雷达图面积与不均衡度
  const calcRadarMetrics = (dims) => {
    const values = dims.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
    const cv = Math.sqrt(variance) / avg; // 变异系数：越高越不均衡
    const area = values.reduce((s, v) => s + v, 0) / 600; // 归一化面积 (0~1)
    return { avg, cv, area, balanced: cv < 0.25 };
  };

  const loadPersona = async () => {
    setLoading(true);
    try {
      // 并行请求：用户基本信息 + 学情画像
      const [userRes, personaRes] = await Promise.all([
        request.get('/user/getUserInfo'),
        getStudentPersona().catch(() => null),
      ]);
      console.log('📊 /user/getUserInfo:', JSON.stringify(userRes, null, 2));
      console.log('📊 /agent/persona:', JSON.stringify(personaRes, null, 2));

      const userOk = (userRes.code === 0 || userRes.code === 200) && userRes.data;
      const personaOk = personaRes && (personaRes.code === 0 || personaRes.code === 200) && personaRes.data;

      // 以 demo 为基础，用真实用户信息覆盖 name/email
      const merged = {
        ...demoPersona,
        ...(personaOk ? personaRes.data : {}),
      };

      if (userOk) {
        const u = userRes.data;
        if (u.username) merged.name = u.username;
        if (u.email) merged.email = u.email;
      }

      setPersona(merged);
    } catch (e) {
      console.error('❌ 加载画像失败:', e);
      setPersona(demoPersona);
    }
    setLoading(false);
  };

  const data = persona || demoPersona;

  return (
    <div className="persona-page-v2">
      <div className="persona-header-v2">
        <div className="persona-header-content-v2">
          <BackArrow onClick={() => navigate(-1)} />
          <span className="persona-header-title-v2">学习画像</span>
        </div>
      </div>

      <div className="persona-content-v2">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* 基本信息 */}
            <div className="persona-section-v2">
              <div className="persona-profile-v2">
                <div className="persona-avatar-v2">{data.name?.charAt(0) || '学'}</div>
                <div className="persona-info-v2">
                  <span className="persona-name-v2">{data.name}</span>
                  <span className="persona-meta-v2">{data.email}</span>
                  <span className="persona-meta-v2">{data.school}{data.major ? ` · ${data.major}` : ''}</span>
                </div>
              </div>
              <div className="persona-tags-v2">
                <span className="persona-tag-v2 style">学习风格: {data.learning_style}</span>
                {data.strengths?.map(s => (
                  <span key={s} className="persona-tag-v2 strength">{s}</span>
                ))}
                {data.weaknesses?.map(w => (
                  <span key={w} className="persona-tag-v2 weakness">{w}</span>
                ))}
              </div>
            </div>

            {/* 整体掌握度概览 */}
            <div className="persona-section-v2" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>{data.overall_mastery}<span style={{ fontSize: 16 }}>分</span></div>
                <div style={{ fontSize: 12, color: '#999' }}>综合掌握度</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{data.class_avg_mastery}<span style={{ fontSize: 16 }}>分</span></div>
                <div style={{ fontSize: 12, color: '#999' }}>班级平均</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: data.overall_mastery >= data.class_avg_mastery ? '#22c55e' : '#ef4444' }}>
                  {data.overall_mastery >= data.class_avg_mastery ? '↑' : '↓'}{Math.abs(data.overall_mastery - data.class_avg_mastery)}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>与班级差距</div>
              </div>
            </div>

            {/* 能力维度 - ECharts 雷达图 */}
            <div className="persona-section-v2">
              <div className="persona-section-title-v2">六维能力雷达图</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                紫色实线 = 你的能力 · 灰色虚线 = 班级平均 · 每个维度得分 = 该维度下关联知识点的 mastery 估算均值
              </div>
              <div ref={radarRef} className="persona-radar-chart" />
              {persona?.dimensions && (() => {
                const metrics = calcRadarMetrics(persona.dimensions);
                return (
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, flexWrap: 'wrap' }}>
                    <span style={{ color: '#666' }}>
                      📐 面积指数：<b style={{ color: '#7c3aed' }}>{Math.round(metrics.area * 100)}%</b>
                      <span style={{ color: '#999', marginLeft: 4 }}>（越大综合能力越强）</span>
                    </span>
                    <span style={{ color: '#666' }}>
                      ⚖️ 均衡度：<b style={{ color: metrics.balanced ? '#22c55e' : '#f59e0b' }}>
                        {metrics.balanced ? '均衡' : '不均衡'}
                      </b>
                      <span style={{ color: '#999', marginLeft: 4 }}>（变异系数 {metrics.cv.toFixed(2)}）</span>
                    </span>
                  </div>
                );
              })()}
              {/* 维度详情 */}
              {data.dimensions?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6, marginTop: 10 }}>
                  {data.dimensions.map((d, i) => {
                    const diff = d.value - d.classAvg;
                    return (
                      <div key={i} style={{ padding: '6px 8px', background: '#fafafa', borderRadius: 6, fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#555' }}>{d.label}</span>
                          <span style={{ fontWeight: 700, color: d.value >= d.classAvg ? '#22c55e' : '#ef4444' }}>
                            {d.value} <span style={{ fontSize: 9, color: '#9ca3af' }}>
                              {diff >= 0 ? `+${diff}` : diff} vs 班均
                            </span>
                          </span>
                        </div>
                        <div style={{ color: '#999', fontSize: 10, marginTop: 1 }}>{d.desc}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 知识点掌握热力图 V5：Module × Topic 网格 */}
            {data.heatmap && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">知识点掌握度热力图</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                  横轴 = 课程 Module，纵轴 = Topic · 色深从 🟢 强项 → 🟡 中等 → 🟠 薄弱 → 🔴 严重不足 · 点击单元格跳转学习
                </div>
                <div className="persona-hm-container-v5">
                  <table className="persona-hm-table-v5">
                    <thead>
                      <tr>
                        <th className="persona-hm-th-v5" style={{ minWidth: 70 }}>Module</th>
                        {(() => {
                          // 按 module 分组取所有 module 的行作为纵轴
                          const allRows = data.heatmap.rows;
                          const moduleOrder = data.heatmap.modules;
                          const grouped = {};
                          allRows.forEach(r => {
                            if (!grouped[r.module]) grouped[r.module] = [];
                            grouped[r.module].push(r);
                          });
                          const maxTopics = Math.max(...Object.values(grouped).map(g => g.length));
                          return Array.from({ length: maxTopics }, (_, i) => (
                            <th key={i} className="persona-hm-th-v5">Topic {i + 1}</th>
                          ));
                        })()}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const allRows = data.heatmap.rows;
                        const moduleOrder = data.heatmap.modules;
                        const grouped = {};
                        allRows.forEach(r => {
                          if (!grouped[r.module]) grouped[r.module] = [];
                          grouped[r.module].push(r);
                        });
                        const maxTopics = Math.max(...Object.values(grouped).map(g => g.length));

                        return moduleOrder.map(mod => {
                          const topics = grouped[mod] || [];
                          return (
                            <tr key={mod}>
                              <td className="persona-hm-module-label-v5">{mod}</td>
                              {Array.from({ length: maxTopics }, (_, i) => {
                                const cell = topics[i];
                                if (!cell) return <td key={i} className="persona-hm-td-v5" style={{ background: '#fafafa' }} />;
                                const s = cell.mastery;
                                // 绿→黄→橙→红 渐变
                                let bg;
                                if (s >= 80) bg = '#10b981';
                                else if (s >= 65) bg = '#22c55e';
                                else if (s >= 55) bg = '#f59e0b';
                                else if (s >= 40) bg = '#f97316';
                                else bg = '#ef4444';
                                return (
                                  <td
                                    key={i}
                                    className="persona-hm-td-v5"
                                    style={{ background: bg }}
                                    title={`${mod} · ${cell.topic}: ${cell.mastery}分`}
                                    onClick={() => navigate(`/student/small-kg?kpId=${cell.kpId}&classId=&title=${encodeURIComponent(cell.topic)}`)}
                                  >
                                    <div className="persona-hm-cell-inner-v5">
                                      <span className="persona-hm-topic-v5" style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>{cell.topic}</span>
                                      <span className="persona-hm-score-v5" style={{ color: '#fff' }}>{cell.mastery}</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                {/* 图例 */}
                <div className="persona-hm-legend-v5">
                  <span style={{ color: '#999' }}>掌握度：</span>
                  {[
                    { label: '≥80 强项', color: '#10b981' },
                    { label: '65-79 较好', color: '#22c55e' },
                    { label: '55-64 中等', color: '#f59e0b' },
                    { label: '40-54 薄弱', color: '#f97316' },
                    { label: '<40 严重不足', color: '#ef4444' },
                  ].map(item => (
                    <div key={item.label} className="persona-hm-legend-item-v5">
                      <div className="persona-hm-legend-swatch-v5" style={{ background: item.color }} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 学习行为 */}
            {data.behavior && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">学习行为分析</div>
                <div className="persona-behavior-v2">
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">学习高峰时段</span>
                    <span className="persona-behavior-value-v2">{data.behavior.peak_hours}</span>
                  </div>
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">平均单次学习时长</span>
                    <span className="persona-behavior-value-v2">{data.behavior.avg_session_min} 分钟</span>
                  </div>
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">答题速度</span>
                    <span className="persona-behavior-value-v2">{data.behavior.answer_speed}</span>
                  </div>
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">复习回顾率</span>
                    <span className="persona-behavior-value-v2">{data.behavior.review_rate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 学习建议 */}
            {data.suggestion && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">学习建议</div>
                <div className="persona-suggestion-v2">💡 {data.suggestion}</div>
              </div>
            )}

            {/* 推荐学习路径 */}
            {data.learning_path && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">推荐学习路径</div>
                <div className="persona-path-v2">
                  {data.learning_path.map((step, idx) => (
                    <div key={idx} className="persona-path-item-v2">
                      <span className="persona-path-num-v2">{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="persona-footer-v2">
              <button
                className="persona-footer-btn-v2"
                onClick={() => navigate('/student/big-kg?title=' + encodeURIComponent('课程知识图谱'))}
              >
                查看大图谱
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
