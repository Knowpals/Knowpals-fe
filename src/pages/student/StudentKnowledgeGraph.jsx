import { useState, useEffect } from 'react';
import { Spin, Empty, Tag, Card } from 'antd';
import {
  NodeIndexOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
} from '@ant-design/icons';
import StudentLayout from '../../layouts/StudentLayout';
import { getReport } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-graph', `
  .graph-page { padding-bottom: 16px; }
  .graph-legend { display: flex; gap: 16px; margin-bottom: 16px; font-size: 12px; color: #6b7280; flex-wrap: wrap; }
  .graph-legend span { display: flex; align-items: center; gap: 4px; }
  .graph-tree-card { border-radius: 12px !important; }
  .graph-node { margin-bottom: 4px; }
  .graph-node-row {
    display: flex; align-items: center; padding: 8px 10px;
    border-radius: 8px; cursor: default; transition: background 0.15s;
  }
  .graph-node-row:hover { background: #f9fafb; }
  .graph-arrow {
    font-size: 10px; color: #9ca3af; margin-right: 6px;
    transition: transform 0.2s; display: inline-block; width: 14px;
  }
  .graph-arrow.open { transform: rotate(90deg); }
  .graph-node-dot {
    width: 12px; height: 12px; border-radius: 50%;
    margin-right: 10px; flex-shrink: 0;
  }
  .graph-node-name { font-size: 14px; color: #1f2937; font-weight: 500; }
`);

const masteryColor = (val) => {
  if (val >= 0.8) return '#10b981';
  if (val >= 0.5) return '#f59e0b';
  return '#ef4444';
};

const masteryLabel = (val) => {
  if (val >= 0.8) return '已掌握';
  if (val >= 0.5) return '一般';
  return '薄弱';
};

const GraphNode = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const mColor = masteryColor(node.mastery || 0);

  return (
    <div className="graph-node" style={{ marginLeft: depth * 20 }}>
      <div className="graph-node-row" onClick={() => hasChildren && setExpanded(!expanded)}>
        {hasChildren && (
          <span className={`graph-arrow ${expanded ? 'open' : ''}`}>&#9654;</span>
        )}
        <div className="graph-node-dot" style={{ background: mColor }} />
        <span className="graph-node-name">{node.name || node.title}</span>
        {node.mastery !== undefined && (
          <Tag
            color={
              node.mastery >= 0.8 ? 'green' : node.mastery >= 0.5 ? 'gold' : 'red'
            }
            style={{ fontSize: 11, marginLeft: 8 }}
          >
            {Math.round(node.mastery * 100)}%
          </Tag>
        )}
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child, idx) => (
          <GraphNode key={child.id || idx} node={child} depth={depth + 1} />
        ))}
    </div>
  );
};

const StudentKnowledgeGraph = () => {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await getReport({ type: 'knowledge_graph' });
      setGraphData(res.data || res);
    } catch (error) {
      console.error('获取知识图谱失败:', error);
      setGraphData({ nodes: [] });
    } finally {
      setLoading(false);
    }
  };

  // 示例数据（后端未就绪时展示）
  const demoTREE = {
    name: 'C++基础',
    mastery: 0.72,
    children: [
      {
        name: '变量与数据类型',
        mastery: 0.85,
        children: [
          { name: '整型 int', mastery: 0.9 },
          { name: '浮点型 float/double', mastery: 0.8 },
          { name: '字符型 char', mastery: 0.85 },
        ],
      },
      {
        name: '运算符',
        mastery: 0.7,
        children: [
          { name: '算术运算符', mastery: 0.85 },
          { name: '关系运算符', mastery: 0.75 },
          { name: '逻辑运算符', mastery: 0.5 },
        ],
      },
      {
        name: '控制结构',
        mastery: 0.65,
        children: [
          { name: 'if条件语句', mastery: 0.8 },
          { name: 'switch语句', mastery: 0.6 },
          {
            name: '循环语句',
            mastery: 0.55,
            children: [
              { name: 'for循环', mastery: 0.7 },
              { name: 'while循环', mastery: 0.5 },
              { name: 'do-while循环', mastery: 0.4 },
            ],
          },
        ],
      },
      {
        name: '数组',
        mastery: 0.55,
        children: [
          { name: '一维数组', mastery: 0.7 },
          { name: '多维数组', mastery: 0.4 },
        ],
      },
      {
        name: '指针',
        mastery: 0.42,
        children: [
          { name: '指针定义', mastery: 0.6 },
          { name: '指针与数组', mastery: 0.35 },
          { name: '动态内存分配', mastery: 0.3 },
        ],
      },
      {
        name: '函数',
        mastery: 0.68,
        children: [
          { name: '函数定义与调用', mastery: 0.8 },
          { name: '参数传递', mastery: 0.65 },
          { name: '递归', mastery: 0.45 },
        ],
      },
    ],
  };

  const treeData = graphData?.nodes || graphData?.tree || demoTREE;

  return (
    <StudentLayout title="知识图谱">
      <div className="graph-page">
        {/* 图例 */}
        <div className="graph-legend">
          <span><CheckCircleFilled style={{ color: '#10b981' }} /> 掌握≥80%</span>
          <span><MinusCircleFilled style={{ color: '#f59e0b' }} /> 一般50-80%</span>
          <span><CloseCircleFilled style={{ color: '#ef4444' }} /> 薄弱&lt;50%</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card className="graph-tree-card" styles={{ body: { padding: 20 } }}>
            <GraphNode node={treeData} />
          </Card>
        )}

        <div style={{ padding: '16px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          绿色=已掌握 | 橙色=一般 | 红色=薄弱
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentKnowledgeGraph;
