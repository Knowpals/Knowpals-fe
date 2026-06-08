import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Card, Segmented, Empty, Tag, Space } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
  ApartmentOutlined,
  PartitionOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import SmallKGNetwork, { masteryColor, normalizeGraph } from '../../components/SmallKGNetwork';
import GraphNode from '../../components/GraphNode';
import BackArrow from '../../components/BackArrow';
import AIFloatButton from '../../components/AIFloatButton';
import '../../utils/sharedPageStyles';
import { getVideoDetail, getSmallKG } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-small-kg', `
  .small-kg-page-v2 { min-height: 100vh; background: #f5f7fa; }
  .small-kg-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 16px 15px; color: #fff;
  }
  .small-kg-header-content-v2 { display: flex; align-items: center; gap: 12px; }
  .small-kg-title-section-v2 { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .small-kg-title-v2 { font-size: 18px; font-weight: 600; }
  .small-kg-subtitle-v2 { font-size: 12px; opacity: 0.85; }
  .small-kg-stats-v2 { display: flex; justify-content: space-around; padding: 8px 0 0; }
  .small-kg-stat-item-v2 { display: flex; flex-direction: column; align-items: center; }
  .small-kg-stat-value-v2 { font-size: 15px; font-weight: 700; }
  .small-kg-stat-label-v2 { font-size: 11px; opacity: 0.85; }
  .small-kg-content-v2 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .small-kg-content-v2 { max-width: 1200px; padding: 16px 32px; } }
  .small-kg-card-v2 { border-radius: 12px !important; overflow: hidden; margin-bottom: 12px; }
  .small-kg-card-v2 .ant-card-body { padding: 0 !important; }
  .small-kg-toolbar-v2 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .small-kg-view-toggle-v2 { flex-shrink: 0; }
  .small-kg-node-detail-v2 {
    background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.25s;
  }
  .small-kg-node-detail-title-v2 { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 6px; }
  .small-kg-node-detail-tags-v2 { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
  .small-kg-node-detail-tag-v2 {
    font-size: 11px; padding: 2px 8px; border-radius: 10px;
    background: #f3f4f6; color: #6b7280;
  }
  .small-kg-node-detail-desc-v2 { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 12px; }
  .small-kg-node-detail-mastery-v2 { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .small-kg-node-detail-bar-v2 { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .small-kg-node-detail-fill-v2 { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .small-kg-node-detail-pct-v2 { font-size: 14px; font-weight: 600; color: #1f2937; min-width: 36px; }
  .small-kg-node-detail-actions-v2 { display: flex; gap: 10px; }
  .small-kg-node-detail-btn-v2 {
    flex: 1; padding: 10px; border-radius: 22px; text-align: center;
    font-size: 13px; font-weight: 500; cursor: pointer; border: none;
  }
  .small-kg-node-detail-btn-v2.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .small-kg-node-detail-btn-v2.outline { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
  .small-kg-footer-v2 { display: flex; gap: 12px; margin-top: 4px; }
  .small-kg-footer-btn-v2 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
  }
  .small-kg-footer-btn-v2.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .small-kg-footer-btn-v2.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
  .small-kg-empty-v2 { text-align: center; padding: 60px 20px; }
`);

// ── 树形 demo（fallback）──
const demoTreeData = {
  name: 'Lagrange 插值',
  mastery: 0.78,
  desc: '用 n 次多项式拟合 n+1 个数据点，是最基本的插值方法。',
  children: [
    {
      name: '插值多项式构造', mastery: 0.85,
      desc: '基函数 lᵢ(x) = Πⱼ≠ᵢ (x-xⱼ)/(xᵢ-xⱼ)',
      children: [
        { name: '线性插值', mastery: 0.90 },
        { name: '抛物插值', mastery: 0.82 },
      ],
    },
    {
      name: '插值余项估计', mastery: 0.70,
      desc: 'R(x) = f⁽ⁿ⁺¹⁾(ξ)/(n+1)! · Π(x-xᵢ)',
      children: [
        { name: '误差界估计', mastery: 0.75 },
        { name: '事后误差估计', mastery: 0.65 },
      ],
    },
    {
      name: 'Runge 现象', mastery: 0.65,
      desc: '高次多项式插值在区间端点处产生振荡',
      children: [
        { name: 'Chebyshev 节点', mastery: 0.68 },
        { name: '分段低次插值', mastery: 0.72 },
      ],
    },
  ],
};

// 将 subgraph 数据解析为 {nodes, edges} 或树形（对齐教师端字段）
function parseSubgraph(raw) {
  if (!raw) return null;
  let data = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch (e) { return null; }
  }
  // 解包常见嵌套格式：{ graph: {...} }, { data: {...} }, { subgraph: {...} }
  if (data && !data.nodes && !data.entities && !data.children && !data.name && !data.title && !data.label) {
    if (data.graph) data = data.graph;
    else if (data.data) data = data.data;
    else if (data.subgraph) data = data.subgraph;
  }
  // 兼容 nodes/entities + edges/relations/links（对齐教师端 entities/relations）
  const nodeList = data?.nodes || data?.entities;
  const edgeList = data?.edges || data?.relations || data?.links;
  if (nodeList || edgeList) {
    // 标准化为 nodes + edges
    return { nodes: nodeList || [], edges: edgeList || [] };
  }
  // 有 children → 树形
  if (data?.children || data?.name || data?.title || data?.label) return data;
  return null;
}

export default function StudentSmallKG() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('network'); // network | tree
  const [graphData, setGraphData] = useState(null);    // 网状数据
  const [treeData, setTreeData] = useState(null);      // 树形数据
  const [selectedNode, setSelectedNode] = useState(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  const videoId = searchParams.get('videoId');
  const classId = searchParams.get('classId');
  const pageTitle = searchParams.get('title') || '视频知识图谱';

  useEffect(() => { fetchGraph(); }, [videoId]);

  // ── 获取图谱数据 ──
  const fetchGraph = async () => {
    setLoading(true);
    // 优先：从视频详情 API 获取 subgraph
    if (videoId) {
      try {
        const res = await getVideoDetail(videoId);
        if ((res.code === 0 || res.code === 200) && res.data) {
          const { subgraph, knowledge, title } = res.data;

          // 尝试解析 subgraph（兼容 nodes/entities + edges/relations）
          const parsed = parseSubgraph(subgraph);
          if (parsed) {
            // 有 nodes/entities → 网状图数据
            if (parsed.nodes && parsed.nodes.length > 0) {
              setGraphData(parsed);
              const { nodes: ns, links: ls } = normalizeGraph(parsed);
              setStats({ nodes: ns.length, edges: ls.length });
              // 也尝试构建树形作为备选
              if (parsed.children || parsed.name || parsed.label) {
                setTreeData(parsed);
              }
              setViewMode('network');
            } else if (parsed.children) {
              // 仅树形
              setTreeData(parsed);
              setGraphData(parsed);
              const { nodes: ns, links: ls } = normalizeGraph(parsed);
              setStats({ nodes: ns.length, edges: ls.length });
              setViewMode('tree');
            }
            setLoading(false);
            return;
          }

          // subgraph 不可用 → 用 knowledge 数组构建树形
          if (knowledge && Array.isArray(knowledge) && knowledge.length > 0) {
            const tree = { name: title || pageTitle, children: knowledge };
            setTreeData(tree);
            setGraphData(tree);  // normalizeGraph 会处理树形
            const { nodes: ns, links: ls } = normalizeGraph(tree);
            setStats({ nodes: ns.length, edges: ls.length });
            setViewMode('tree');
            setLoading(false);
            return;
          }
        }
      } catch (e) { /* fallback */ }
    }

    // 其次：调用 /agent/small-kg
    try {
      const res = await getSmallKG({ video_id: videoId, class_id: classId });
      if ((res.code === 0 || res.code === 200) && res.data) {
        const kg = res.data.tree || res.data;
        // 兼容 nodes/entities
        if (kg.nodes || kg.entities || kg.edges || kg.relations || kg.links) {
          setGraphData(kg);
          const { nodes: ns, links: ls } = normalizeGraph(kg);
          setStats({ nodes: ns.length, edges: ls.length });
          setViewMode('network');
        } else {
          setTreeData(kg);
          setGraphData(kg);
          const { nodes: ns, links: ls } = normalizeGraph(kg);
          setStats({ nodes: ns.length, edges: ls.length });
          setViewMode('tree');
        }
        setLoading(false);
        return;
      }
    } catch (e) { /* fallback */ }

    // 最后：demo 数据
    setTreeData(demoTreeData);
    setGraphData(null);
    setViewMode('tree');
    setLoading(false);
  };

  // ── 节点点击 ──
  const handleNodeClick = (rawNode) => {
    // rawNode 来自 SmallKGNetwork 的 _raw 字段，或在 tree 模式下的 node 对象
    setSelectedNode(rawNode);
  };

  // ── 去练习 ──
  const goPractice = (node) => {
    const name = node?.name || node?.title || node?.label || '';
    const kid = node?.id || node?.knowledge_id || '';
    navigate(`/student/practice?videoId=${videoId || ''}&title=${encodeURIComponent(name)}&classId=${classId || ''}&knowledgeId=${kid}`);
  };

  // ── 去大图谱 ──
  const goBigKG = () => {
    navigate(`/student/big-kg?classId=${classId || ''}&title=${encodeURIComponent('课程知识图谱')}`);
  };

  return (
    <div className="small-kg-page-v2">
      {/* 头部 */}
      <div className="small-kg-header-v2">
        <div className="small-kg-header-content-v2">
          <BackArrow onClick={() => navigate(-1)} />
          <div className="small-kg-title-section-v2">
            <span className="small-kg-title-v2">{decodeURIComponent(pageTitle)}</span>
            <span className="small-kg-subtitle-v2">视频知识点网络 · AI 自动构建</span>
          </div>
        </div>
        {stats.nodes > 0 && (
          <div className="small-kg-stats-v2">
            <div className="small-kg-stat-item-v2">
              <span className="small-kg-stat-value-v2">{stats.nodes}</span>
              <span className="small-kg-stat-label-v2">知识点</span>
            </div>
            <div className="small-kg-stat-item-v2">
              <span className="small-kg-stat-value-v2" style={{ color: '#a78bfa' }}>{stats.edges}</span>
              <span className="small-kg-stat-label-v2">关系边</span>
            </div>
          </div>
        )}
      </div>

      <div className="small-kg-content-v2">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <div style={{ color: '#9ca3af', marginTop: 12 }}>正在加载知识图谱...</div>
          </div>
        ) : (
          <>
            {/* 工具栏：视图切换 */}
            {graphData && treeData && (
              <div className="small-kg-toolbar-v2">
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  当前呈现 {viewMode === 'network' ? '网状' : '树形'}视图
                </div>
                <Segmented
                  className="small-kg-view-toggle-v2"
                  size="small"
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { label: <><ApartmentOutlined /> 网状</>, value: 'network' },
                    { label: <><PartitionOutlined /> 树形</>, value: 'tree' },
                  ]}
                />
              </div>
            )}

            {/* 网络视图（对齐教师端 Card 包装） */}
            {viewMode === 'network' && graphData && (
              <Card
                title={
                  <Space>
                    <NodeIndexOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                    <span>视频知识图谱</span>
                    <Tag color="purple" style={{ marginLeft: 8 }}>{stats.nodes} 节点</Tag>
                    <Tag color="blue">{stats.edges} 关系</Tag>
                  </Space>
                }
                className="small-kg-card-v2"
                style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}
                styles={{ body: { padding: 0 } }}
              >
                <SmallKGNetwork
                  data={graphData}
                  onNodeClick={handleNodeClick}
                />
              </Card>
            )}

            {/* 树形视图 */}
            {viewMode === 'tree' && treeData && (
              <Card className="small-kg-card-v2" styles={{ body: { padding: 20 } }}>
                <div style={{ marginBottom: 8, fontSize: 12, color: '#9ca3af', display: 'flex', gap: 14 }}>
                  <span><CheckCircleFilled style={{ color: '#10b981' }} /> 掌握≥80%</span>
                  <span><MinusCircleFilled style={{ color: '#f59e0b' }} /> 一般50-80%</span>
                  <span><CloseCircleFilled style={{ color: '#ef4444' }} /> 薄弱&lt;50%</span>
                </div>
                <GraphNode
                  node={treeData}
                  defaultExpanded={true}
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                />
              </Card>
            )}

            {/* 无数据提示 */}
            {!graphData && !treeData && (
              <div className="small-kg-empty-v2">
                <Empty description="暂无知识图谱数据" />
              </div>
            )}

            {/* 选中节点详情面板 */}
            {selectedNode && (
              <div className="small-kg-node-detail-v2">
                <div className="small-kg-node-detail-title-v2">
                  {selectedNode.name || selectedNode.title || selectedNode.label || '知识点'}
                </div>

                {/* 标签 */}
                <div className="small-kg-node-detail-tags-v2">
                  {selectedNode.type && (
                    <span className="small-kg-node-detail-tag-v2">{selectedNode.type}</span>
                  )}
                  {selectedNode.knowledge_id && (
                    <span className="small-kg-node-detail-tag-v2">ID: {selectedNode.knowledge_id}</span>
                  )}
                  {selectedNode.difficulty && (
                    <span className="small-kg-node-detail-tag-v2">难度: {selectedNode.difficulty}</span>
                  )}
                </div>

                {/* 描述 */}
                {(selectedNode.desc || selectedNode.content || selectedNode.description) && (
                  <div className="small-kg-node-detail-desc-v2">
                    {selectedNode.desc || selectedNode.content || selectedNode.description}
                  </div>
                )}

                {/* 掌握度条 */}
                {(selectedNode.mastery !== undefined || selectedNode.master_score !== undefined) && (
                  <div className="small-kg-node-detail-mastery-v2">
                    <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 40 }}>掌握度</span>
                    <div className="small-kg-node-detail-bar-v2">
                      <div
                        className="small-kg-node-detail-fill-v2"
                        style={{
                          width: `${Math.round((selectedNode.mastery ?? selectedNode.master_score ?? 0) * 100)}%`,
                          background: masteryColor(selectedNode.mastery ?? selectedNode.master_score ?? 0),
                        }}
                      />
                    </div>
                    <span className="small-kg-node-detail-pct-v2">
                      {Math.round((selectedNode.mastery ?? selectedNode.master_score ?? 0) * 100)}%
                    </span>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="small-kg-node-detail-actions-v2">
                  <button
                    className="small-kg-node-detail-btn-v2 primary"
                    onClick={() => goPractice(selectedNode)}
                  >
                    练习此知识点
                  </button>
                  <button
                    className="small-kg-node-detail-btn-v2 outline"
                    onClick={() => navigate(`/student/chat?videoId=${videoId || ''}&videoTitle=${encodeURIComponent(selectedNode.name || selectedNode.title || '')}`)}
                  >
                    AI 问答
                  </button>
                </div>
              </div>
            )}

            {/* 底部操作 */}
            <div className="small-kg-footer-v2">
              <button className="small-kg-footer-btn-v2 primary" onClick={goBigKG}>
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
