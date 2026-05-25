import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Card, Segmented } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
} from '@ant-design/icons';
import GraphNode from '../../components/GraphNode';
import AIFloatButton from '../../components/AIFloatButton';
import { getBigKG } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-big-kg', `
  .big-kg-page-v2 { min-height: 100vh; background: #f5f7fa; }
  .big-kg-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 16px 15px; color: #fff;
  }
  .big-kg-header-content-v2 { display: flex; align-items: center; gap: 12px; }
  .big-kg-back-btn-v2 { font-size: 22px; color: #fff; cursor: pointer; width: 30px; text-align: center; }
  .big-kg-title-section-v2 { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .big-kg-title-v2 { font-size: 18px; font-weight: 600; }
  .big-kg-subtitle-v2 { font-size: 12px; opacity: 0.85; }
  .big-kg-stats-v2 { display: flex; justify-content: space-around; padding: 8px 0 0; }
  .big-kg-stat-item-v2 { display: flex; flex-direction: column; align-items: center; }
  .big-kg-stat-value-v2 { font-size: 15px; font-weight: 700; }
  .big-kg-stat-label-v2 { font-size: 11px; opacity: 0.85; }
  .big-kg-content-v2 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .big-kg-content-v2 { max-width: 1200px; padding: 16px 32px; } }
  .big-kg-legend-v2 { display: flex; gap: 16px; margin-bottom: 12px; font-size: 12px; color: #6b7280; flex-wrap: wrap; }
  .big-kg-legend-v2 span { display: flex; align-items: center; gap: 4px; }
  .big-kg-filter-v2 { margin-bottom: 12px; }
  .big-kg-card-v2 { border-radius: 12px !important; }
  .big-kg-footer-v2 { display: flex; gap: 12px; margin-top: 16px; }
  .big-kg-footer-btn-v2 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
  }
  .big-kg-footer-btn-v2.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .big-kg-footer-btn-v2.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
`);

const demoBigKG = {
  name: '数值分析',
  mastery: 0.68,
  children: [
    {
      name: '插值法',
      mastery: 0.72,
      children: [
        {
          name: 'Lagrange 插值',
          mastery: 0.78,
          desc: '用 n 次多项式拟合 n+1 个数据点',
          children: [
            { name: '插值多项式构造', mastery: 0.85 },
            { name: '插值余项估计', mastery: 0.70 },
            { name: 'Runge 现象', mastery: 0.65 },
          ],
        },
        {
          name: 'Newton 插值',
          mastery: 0.68,
          desc: '差商形式的插值多项式',
          children: [
            { name: '差商计算', mastery: 0.75 },
            { name: 'Newton 前插公式', mastery: 0.65 },
            { name: 'Newton 后插公式', mastery: 0.60 },
          ],
        },
        {
          name: 'Hermite 插值',
          mastery: 0.55,
          desc: '带导数条件的插值',
          children: [
            { name: '两点三次 Hermite', mastery: 0.60 },
            { name: '重节点差商', mastery: 0.45 },
          ],
        },
      ],
    },
    {
      name: '数值积分',
      mastery: 0.64,
      children: [
        {
          name: 'Newton-Cotes 公式',
          mastery: 0.70,
          desc: '等距节点的插值型积分',
          children: [
            { name: '梯形公式', mastery: 0.85 },
            { name: 'Simpson 公式', mastery: 0.75 },
            { name: 'Cotes 系数', mastery: 0.55 },
          ],
        },
        {
          name: '复化积分',
          mastery: 0.62,
          desc: '分段低次插值积分',
          children: [
            { name: '复化梯形公式', mastery: 0.70 },
            { name: '复化 Simpson 公式', mastery: 0.65 },
            { name: '步长选择', mastery: 0.50 },
          ],
        },
        {
          name: 'Gauss 型积分',
          mastery: 0.48,
          desc: '最高代数精度的积分方法',
          children: [
            { name: 'Gauss-Legendre', mastery: 0.55 },
            { name: '正交多项式', mastery: 0.40 },
          ],
        },
      ],
    },
    {
      name: '方程求根',
      mastery: 0.70,
      children: [
        {
          name: '二分法',
          mastery: 0.88,
          desc: '简单可靠的区间缩小法',
          children: [
            { name: '区间选择', mastery: 0.90 },
            { name: '收敛速度', mastery: 0.85 },
          ],
        },
        {
          name: '不动点迭代',
          mastery: 0.65,
          desc: 'x = φ(x) 形式的迭代',
          children: [
            { name: '迭代格式构造', mastery: 0.70 },
            { name: '收敛性判定', mastery: 0.60 },
          ],
        },
        {
          name: 'Newton 迭代法',
          mastery: 0.72,
          desc: '切线法求根，平方收敛',
          children: [
            { name: '迭代公式推导', mastery: 0.80 },
            { name: '收敛阶分析', mastery: 0.65 },
            { name: '重根处理', mastery: 0.55 },
          ],
        },
      ],
    },
    {
      name: '线性方程组',
      mastery: 0.60,
      children: [
        {
          name: '直接法',
          mastery: 0.75,
          children: [
            { name: 'Gauss 消元', mastery: 0.85 },
            { name: 'LU 分解', mastery: 0.70 },
            { name: 'Cholesky 分解', mastery: 0.60 },
          ],
        },
        {
          name: '迭代法',
          mastery: 0.50,
          children: [
            { name: 'Jacobi 迭代', mastery: 0.55 },
            { name: 'Gauss-Seidel 迭代', mastery: 0.50 },
            { name: 'SOR 方法', mastery: 0.40 },
          ],
        },
      ],
    },
    {
      name: '特征值问题',
      mastery: 0.45,
      children: [
        {
          name: '幂法',
          mastery: 0.52,
          children: [
            { name: '主特征值计算', mastery: 0.60 },
            { name: '反幂法', mastery: 0.45 },
          ],
        },
        {
          name: 'QR 方法',
          mastery: 0.35,
          children: [
            { name: 'Householder 变换', mastery: 0.40 },
            { name: '上 Hessenberg 化', mastery: 0.30 },
          ],
        },
      ],
    },
  ],
};

function countNodes(node) {
  let count = 1;
  if (node.children) {
    node.children.forEach(c => { count += countNodes(c); });
  }
  return count;
}

function countByMastery(node, threshold) {
  let count = node.mastery >= threshold ? 1 : 0;
  if (node.children) {
    node.children.forEach(c => { count += countByMastery(c, threshold); });
  }
  return count;
}

export default function StudentBigKG() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [filter, setFilter] = useState('all');

  const classId = searchParams.get('classId');
  const pageTitle = searchParams.get('title') || '课程知识图谱';

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await getBigKG({ class_id: classId });
      if ((res.code === 0 || res.code === 200) && res.data) {
        setGraphData(res.data.tree || res.data);
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setGraphData(demoBigKG);
    setLoading(false);
  };

  const treeData = graphData || demoBigKG;
  const totalNodes = countNodes(treeData);
  const masterNodes = countByMastery(treeData, 0.8);
  const avgNodes = countByMastery(treeData, 0.5) - masterNodes;
  const weakNodes = totalNodes - masterNodes - avgNodes;

  const handleNodeClick = (node) => {
    navigate(`/student/small-kg?title=${encodeURIComponent(node.name || node.title)}&classId=${classId || ''}`);
  };

  const filterTree = (node, f) => {
    if (f === 'all') return true;
    if (f === 'mastered') return node.mastery >= 0.8;
    if (f === 'weak') return node.mastery < 0.5;
    return true;
  };

  const renderFilteredNode = (node, depth = 0) => {
    const showNode = filterTree(node, filter);
    const children = node.children
      ? node.children.map(c => renderFilteredNode(c, depth + 1)).filter(Boolean)
      : [];
    if (!showNode && children.length === 0) return null;

    return (
      <GraphNode
        key={node.name}
        node={node}
        depth={depth}
        defaultExpanded={filter !== 'all'}
        onNodeClick={handleNodeClick}
      />
    );
  };

  return (
    <div className="big-kg-page-v2">
      <div className="big-kg-header-v2">
        <div className="big-kg-header-content-v2">
          <div className="big-kg-back-btn-v2" onClick={() => navigate(-1)}>←</div>
          <div className="big-kg-title-section-v2">
            <span className="big-kg-title-v2">{decodeURIComponent(pageTitle)}</span>
            <span className="big-kg-subtitle-v2">知识图谱</span>
          </div>
        </div>
        <div className="big-kg-stats-v2">
          <div className="big-kg-stat-item-v2">
            <span className="big-kg-stat-value-v2">{totalNodes}</span>
            <span className="big-kg-stat-label-v2">总节点</span>
          </div>
          <div className="big-kg-stat-item-v2">
            <span className="big-kg-stat-value-v2" style={{ color: '#10b981' }}>{masterNodes}</span>
            <span className="big-kg-stat-label-v2">已掌握</span>
          </div>
          <div className="big-kg-stat-item-v2">
            <span className="big-kg-stat-value-v2" style={{ color: '#f59e0b' }}>{avgNodes}</span>
            <span className="big-kg-stat-label-v2">一般</span>
          </div>
          <div className="big-kg-stat-item-v2">
            <span className="big-kg-stat-value-v2" style={{ color: '#ef4444' }}>{weakNodes}</span>
            <span className="big-kg-stat-label-v2">薄弱</span>
          </div>
        </div>
      </div>

      <div className="big-kg-content-v2">
        <div className="big-kg-legend-v2">
          <span><CheckCircleFilled style={{ color: '#10b981' }} /> 掌握≥80%</span>
          <span><MinusCircleFilled style={{ color: '#f59e0b' }} /> 一般50-80%</span>
          <span><CloseCircleFilled style={{ color: '#ef4444' }} /> 薄弱&lt;50%</span>
        </div>

        <div className="big-kg-filter-v2">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: '全部', value: 'all' },
              { label: '已掌握', value: 'mastered' },
              { label: '薄弱', value: 'weak' },
            ]}
            size="small"
            block
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card className="big-kg-card-v2" styles={{ body: { padding: 20 } }}>
            {renderFilteredNode(treeData)}
          </Card>
        )}

        <div className="big-kg-footer-v2">
          <button className="big-kg-footer-btn-v2 primary" onClick={() => navigate(`/student/deep-practice?classId=${classId || ''}&title=${encodeURIComponent(pageTitle)}`)}>
            深度练习
          </button>
          <button className="big-kg-footer-btn-v2 secondary" onClick={() => navigate(-1)}>
            返回课程
          </button>
        </div>
      </div>

      <AIFloatButton />
    </div>
  );
}
