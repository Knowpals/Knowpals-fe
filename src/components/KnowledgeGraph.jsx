import React, { useState, useEffect, useRef } from 'react';
import { Spin, Empty, Tag, Select, Space, Typography } from 'antd';
import { NodeIndexOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Text } = Typography;

const TYPE_COLORS = {
  Subject: '#1a1a2e',
  Module: '#722ed1',
  Topic: '#1890ff',
  Concept: '#52c41a',
  Algorithm: '#fa8c16',
  Formula: '#eb2f96',
  Theorem: '#13c2c2',
};

const RELATION_LABELS = {
  contains: '包含',
  belongs_to: '属于',
  strong_prerequisite: '强前置',
  weak_prerequisite: '弱前置',
  similar_to: '相似',
  confused_with: '易混淆',
};

function parseCSVLines(text) {
  const lines = text.trim().split('\n');
  if (lines.length <= 1) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
    result.push(obj);
  }
  return result;
}

function buildGraphData(allNodes, allEdges, expandedSet) {
  const nodeMap = new Map();
  const shownIds = new Set();
  const links = [];

  // 始终显示所有 Module
  const modules = allNodes.filter(n => n.type === 'Module');
  modules.forEach(n => { nodeMap.set(n.node_id, n); shownIds.add(n.node_id); });

  // Subject
  const subject = allNodes.find(n => n.type === 'Subject');
  if (subject) { nodeMap.set(subject.node_id, subject); shownIds.add(subject.node_id); }

  // Subject ↔ Module contains/belongs_to
  allEdges.filter(e =>
    e.relation === 'contains' &&
    (e.from === 'S_NUMERICAL_ANALYSIS' || e.to === 'S_NUMERICAL_ANALYSIS')
  ).forEach(e => links.push(e));

  // Module ↔ Module 前置关系
  allEdges.filter(e =>
    shownIds.has(e.from) && shownIds.has(e.to) &&
    (e.relation === 'strong_prerequisite' || e.relation === 'weak_prerequisite')
  ).forEach(e => links.push(e));

  // 展开的子节点
  expandedSet.forEach(modId => {
    allEdges.filter(e => e.relation === 'contains' && e.from === modId).forEach(e => {
      const child = allNodes.find(n => n.node_id === e.to);
      if (child && !shownIds.has(child.node_id)) {
        nodeMap.set(child.node_id, child);
        shownIds.add(child.node_id);
        links.push(e);
      }
    });
  });

  return { graphNodes: Array.from(nodeMap.values()), graphLinks: links };
}

const KnowledgeGraph = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const allNodesRef = useRef([]);
  const allEdgesRef = useRef([]);
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphLinks, setGraphLinks] = useState([]);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [selectedModule, setSelectedModule] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const [nr, er] = await Promise.all([
          fetch('/data/knowledge_nodes.csv'),
          fetch('/data/knowledge_edges_v1_candidate_ai_audited.csv'),
        ]);
        if (!nr.ok || !er.ok) throw new Error('CSV 文件加载失败');
        const nodesData = parseCSVLines(await nr.text());
        const edgesData = parseCSVLines(await er.text());
        allNodesRef.current = nodesData;
        allEdgesRef.current = edgesData;
        const { graphNodes: gn, graphLinks: gl } = buildGraphData(nodesData, edgesData, new Set());
        setGraphNodes(gn);
        setGraphLinks(gl);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChartClick = (params) => {
    if (params.dataType !== 'node') return;
    const nodeId = params.data?.id || params.name;
    const node = allNodesRef.current.find(n => n.node_id === nodeId);
    if (!node || node.type !== 'Module') return;

    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      const { graphNodes: gn, graphLinks: gl } = buildGraphData(allNodesRef.current, allEdgesRef.current, next);
      setGraphNodes(gn);
      setGraphLinks(gl);
      return next;
    });
  };

  const handleModuleFilter = (val) => {
    setSelectedModule(val || 'all');
    const expandSet = val && val !== 'all' ? new Set([val]) : new Set();
    setExpandedModules(expandSet);
    const { graphNodes: gn, graphLinks: gl } = buildGraphData(allNodesRef.current, allEdgesRef.current, expandSet);
    setGraphNodes(gn);
    setGraphLinks(gl);
  };

  const getOption = () => {
    const categories = Object.entries(TYPE_COLORS).map(([name, color]) => ({
      name, itemStyle: { color },
    }));

    const echartsNodes = graphNodes.map(n => ({
      id: n.node_id,
      name: n.label,
      category: n.type,
      symbolSize:
        n.type === 'Subject' ? 55 :
        n.type === 'Module' ? 40 :
        n.type === 'Topic' ? 24 : 17,
      label: {
        show: true,
        fontSize:
          n.type === 'Subject' ? 16 :
          n.type === 'Module' ? 14 :
          n.type === 'Topic' ? 11 : 10,
        position: 'right',
        distance: 6,
        color: '#333',
      },
      itemStyle: {
        borderWidth: n.type === 'Module' && expandedModules.has(n.node_id) ? 3 : 0,
        borderColor: '#faad14',
      },
    }));

    const echartsLinks = graphLinks.map(e => ({
      source: e.from,
      target: e.to,
      lineStyle: {
        color:
          e.relation === 'contains' || e.relation === 'belongs_to' ? '#d9d9d9' :
          e.relation === 'strong_prerequisite' ? '#ff4d4f' :
          e.relation === 'weak_prerequisite' ? '#faad14' : '#1890ff',
        width: e.relation === 'strong_prerequisite' ? 2 : 1,
        curveness: e.relation === 'strong_prerequisite' || e.relation === 'weak_prerequisite' ? 0.3 : 0.1,
        type: e.relation === 'weak_prerequisite' ? 'dashed' : 'solid',
      },
    }));

    return {
      tooltip: {
        formatter: (params) => {
          if (params.dataType === 'node') {
            const nd = allNodesRef.current.find(x => x.node_id === params.data.id);
            return `<b>${params.name}</b><br/>类型: ${nd?.type || ''}<br/>${nd?.description || ''}`;
          }
          if (params.dataType === 'edge') {
            const rel = RELATION_LABELS[params.data?.relation] || '';
            const fromNode = allNodesRef.current.find(x => x.node_id === params.data.source);
            const toNode = allNodesRef.current.find(x => x.node_id === params.data.target);
            return `${fromNode?.label || '?'} → ${toNode?.label || '?'}<br/>${rel}`;
          }
          return '';
        },
      },
      legend: {
        data: categories.map(c => c.name),
        bottom: 0,
        type: 'scroll',
      },
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        categories,
        nodes: echartsNodes,
        edges: echartsLinks,
        force: {
          repulsion: 500,
          gravity: 0.08,
          edgeLength: [120, 350],
          friction: 0.6,
        },
        emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
        scaleLimit: { min: 0.3, max: 5 },
      }],
    };
  };

  const modules = allNodesRef.current.filter(n => n.type === 'Module');

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /><div style={{ marginTop: 16, color: '#999' }}>加载知识图谱...</div></div>;
  }

  if (error) {
    return <Empty description={`加载失败: ${error}`} />;
  }

  if (graphNodes.length === 0) {
    return <Empty description="暂无知识图谱数据" />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <NodeIndexOutlined style={{ color: '#722ed1' }} />
          <Text strong style={{ fontSize: 15 }}>课程知识图谱</Text>
          <Tag color="purple">{allNodesRef.current.length} 节点</Tag>
          <Tag color="blue">{allEdgesRef.current.length} 关系</Tag>
        </Space>
        <Select
          style={{ width: 200 }}
          placeholder="筛选模块"
          value={selectedModule}
          onChange={handleModuleFilter}
          allowClear
        >
          <Select.Option value="all">全部模块</Select.Option>
          {modules.map(m => (
            <Select.Option key={m.node_id} value={m.node_id}>{m.label}</Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', background: '#fafafa' }}>
        <ReactECharts
          option={getOption()}
          style={{ height: 650 }}
          onEvents={{ click: handleChartClick }}
          notMerge
        />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#999' }}>
        <span>💡 点击模块节点展开/收起子知识点</span>
        <span>🟡 金色边框 = 已展开</span>
        <span>🔴 红色连线 = 强前置</span>
        <span>🟠 橙色虚线 = 弱前置</span>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
