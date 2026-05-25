import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Card } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
} from '@ant-design/icons';
import GraphNode from '../../components/GraphNode';
import AIFloatButton from '../../components/AIFloatButton';
import { getSmallKG } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-small-kg', `
  .small-kg-page-v2 { min-height: 100vh; background: #f5f7fa; }
  .small-kg-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 16px 15px; color: #fff;
  }
  .small-kg-header-content-v2 { display: flex; align-items: center; gap: 12px; }
  .small-kg-back-btn-v2 { font-size: 22px; color: #fff; cursor: pointer; width: 30px; text-align: center; }
  .small-kg-title-section-v2 { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .small-kg-title-v2 { font-size: 18px; font-weight: 600; }
  .small-kg-subtitle-v2 { font-size: 12px; opacity: 0.85; }
  .small-kg-content-v2 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .small-kg-content-v2 { max-width: 1200px; padding: 16px 32px; } }
  .small-kg-legend-v2 { display: flex; gap: 16px; margin-bottom: 12px; font-size: 12px; color: #6b7280; flex-wrap: wrap; }
  .small-kg-legend-v2 span { display: flex; align-items: center; gap: 4px; }
  .small-kg-card-v2 { border-radius: 12px !important; margin-bottom: 12px; }
  .small-kg-node-detail-v2 {
    background: #fff; border-radius: 12px; padding: 16px;
    margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .small-kg-node-detail-title-v2 { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .small-kg-node-detail-desc-v2 { font-size: 13px; color: #666; line-height: 1.5; margin-bottom: 12px; }
  .small-kg-node-detail-mastery-v2 { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .small-kg-node-detail-bar-v2 { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .small-kg-node-detail-fill-v2 { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .small-kg-node-detail-pct-v2 { font-size: 14px; font-weight: 600; color: #333; }
  .small-kg-node-detail-btn-v2 {
    width: 100%; padding: 12px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
    background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff;
  }
  .small-kg-footer-v2 { display: flex; gap: 12px; }
  .small-kg-footer-btn-v2 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
  }
  .small-kg-footer-btn-v2.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .small-kg-footer-btn-v2.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
`);

// 以 Lagrange 插值为中心的 demo 小图谱
const demoSmallKG = {
  name: 'Lagrange 插值',
  mastery: 0.78,
  desc: '用 n 次多项式拟合 n+1 个数据点，是最基本的插值方法。给定 n+1 个互异节点 x₀,...,xₙ 及对应的函数值 f(x₀),...,f(xₙ)，存在唯一的 n 次插值多项式 Lₙ(x) 满足插值条件。',
  children: [
    {
      name: '插值多项式构造',
      mastery: 0.85,
      desc: '基函数 lᵢ(x) = Πⱼ≠ᵢ (x-xⱼ)/(xᵢ-xⱼ)',
      children: [
        { name: '线性插值', mastery: 0.90 },
        { name: '抛物插值', mastery: 0.82 },
      ],
    },
    {
      name: '插值余项估计',
      mastery: 0.70,
      desc: 'R(x) = f⁽ⁿ⁺¹⁾(ξ)/(n+1)! · Π(x-xᵢ)',
      children: [
        { name: '误差界估计', mastery: 0.75 },
        { name: '事后误差估计', mastery: 0.65 },
      ],
    },
    {
      name: 'Runge 现象',
      mastery: 0.65,
      desc: '高次多项式插值在区间端点处产生振荡',
      children: [
        { name: 'Chebyshev 节点', mastery: 0.68 },
        { name: '分段低次插值', mastery: 0.72 },
      ],
    },
  ],
};

export default function StudentSmallKG() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const videoId = searchParams.get('videoId');
  const classId = searchParams.get('classId');
  const pageTitle = searchParams.get('title') || '知识图谱';

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await getSmallKG({ video_id: videoId, class_id: classId });
      if ((res.code === 0 || res.code === 200) && res.data) {
        setGraphData(res.data.tree || res.data);
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setGraphData(demoSmallKG);
    setSelectedNode(demoSmallKG);
    setLoading(false);
  };

  const treeData = graphData || demoSmallKG;

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const masteryColor = (val) => {
    if (val >= 0.8) return '#10b981';
    if (val >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="small-kg-page-v2">
      <div className="small-kg-header-v2">
        <div className="small-kg-header-content-v2">
          <div className="small-kg-back-btn-v2" onClick={() => navigate(-1)}>←</div>
          <div className="small-kg-title-section-v2">
            <span className="small-kg-title-v2">{decodeURIComponent(pageTitle)}</span>
            <span className="small-kg-subtitle-v2">知识点图谱</span>
          </div>
        </div>
      </div>

      <div className="small-kg-content-v2">
        <div className="small-kg-legend-v2">
          <span><CheckCircleFilled style={{ color: '#10b981' }} /> 掌握≥80%</span>
          <span><MinusCircleFilled style={{ color: '#f59e0b' }} /> 一般50-80%</span>
          <span><CloseCircleFilled style={{ color: '#ef4444' }} /> 薄弱&lt;50%</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card className="small-kg-card-v2" styles={{ body: { padding: 20 } }}>
              <GraphNode
                node={treeData}
                defaultExpanded={true}
                onNodeClick={handleNodeClick}
              />
            </Card>

            {selectedNode && (
              <div className="small-kg-node-detail-v2">
                <div className="small-kg-node-detail-title-v2">{selectedNode.name || selectedNode.title}</div>
                {selectedNode.desc && (
                  <div className="small-kg-node-detail-desc-v2">{selectedNode.desc}</div>
                )}
                <div className="small-kg-node-detail-mastery-v2">
                  <span style={{ fontSize: 12, color: '#999', minWidth: 40 }}>掌握度</span>
                  <div className="small-kg-node-detail-bar-v2">
                    <div
                      className="small-kg-node-detail-fill-v2"
                      style={{ width: `${Math.round((selectedNode.mastery || 0) * 100)}%`, background: masteryColor(selectedNode.mastery || 0) }}
                    />
                  </div>
                  <span className="small-kg-node-detail-pct-v2">{Math.round((selectedNode.mastery || 0) * 100)}%</span>
                </div>
                <button
                  className="small-kg-node-detail-btn-v2"
                  onClick={() => navigate(`/student/practice?videoId=${videoId || ''}&title=${encodeURIComponent(selectedNode.name || selectedNode.title)}&classId=${classId || ''}`)}
                >
                  去练习此知识点
                </button>
              </div>
            )}

            <div className="small-kg-footer-v2">
              <button
                className="small-kg-footer-btn-v2 primary"
                onClick={() => navigate(`/student/big-kg?classId=${classId || ''}&title=${encodeURIComponent('课程知识图谱')}`)}
              >
                查看大图谱
              </button>
              <button className="small-kg-footer-btn-v2 secondary" onClick={() => navigate(-1)}>
                返回
              </button>
            </div>
          </>
        )}
      </div>

      <AIFloatButton />
    </div>
  );
}
