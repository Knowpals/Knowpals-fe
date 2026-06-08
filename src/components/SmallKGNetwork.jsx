import { useEffect, useRef, useState, useCallback } from 'react';
import * as echarts from 'echarts';
import { injectStyles } from '../utils/injectStyles';

injectStyles('small-kg-network', `
  .skg-network-wrapper {
    width: 100%; position: relative;
    border: 1px solid #f0f0f0; border-radius: 12px;
    background: linear-gradient(135deg, #f5f3ff 0%, #e8f4f8 100%);
    overflow: hidden;
  }
  .skg-network-chart { width: 100%; height: 500px; }
  @media (min-width: 481px) { .skg-network-chart { height: 580px; } }
  .skg-network-toolbar {
    position: absolute; top: 8px; right: 12px; z-index: 10;
    display: flex; gap: 6px; flex-wrap: wrap;
  }
  .skg-network-btn {
    padding: 5px 14px; border-radius: 16px; border: 1px solid #d1d5db;
    background: #fff; font-size: 11px; color: #6b7280;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .skg-network-btn:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
  .skg-network-btn.active { border-color: #7c3aed; background: #ede9fe; color: #7c3aed; }
  .skg-network-legend {
    position: absolute; bottom: 10px; left: 14px; z-index: 10;
    display: flex; gap: 12px; flex-wrap: wrap;
    font-size: 11px; color: #6b7280;
    background: rgba(255,255,255,0.92); padding: 5px 12px;
    border-radius: 8px; pointer-events: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .skg-network-legend-item { display: flex; align-items: center; gap: 4px; }
  .skg-network-hint {
    position: absolute; top: 10px; left: 14px; z-index: 10;
    font-size: 11px; color: #9ca3af; pointer-events: none;
  }
`);

// ── 节点配色：按掌握度 ──
function masteryColor(val) {
  if (val == null || val === undefined) return '#7c3aed'; // 无数据默认紫色
  if (val >= 0.8) return '#10b981';  // 掌握 → 绿
  if (val >= 0.5) return '#f59e0b';  // 一般 → 橙
  return '#ef4444';                   // 薄弱 → 红
}

function masteryLabel(val) {
  if (val == null || val === undefined) return '未知';
  if (val >= 0.8) return '已掌握';
  if (val >= 0.5) return '一般';
  return '薄弱';
}

// ── 边类型配色（对齐教师端配色）──
const EDGE_STYLE = {
  prerequisite:         { color: '#ff4d4f', width: 2.0, type: 'solid',  label: '前置依赖' },
  strong_prerequisite:  { color: '#ff4d4f', width: 2.2, type: 'solid',  label: '强前置' },
  weak_prerequisite:    { color: '#faad14', width: 1.4, type: 'solid',  label: '弱前置' },
  similar_to:           { color: '#facc15', width: 1.0, type: 'dashed', label: '相似' },
  confused_with:        { color: '#fb923c', width: 1.1, type: 'dashed', label: '易混淆' },
  belongs_to:           { color: '#d1d5db', width: 0.8, type: 'dotted', label: '所属' },
  default:              { color: '#c0c0c0', width: 1.0, type: 'solid',  label: '关联' },
};

// ── 节点类型 → 默认大小（对齐教师端）──
function typeSize(type) {
  if (!type) return 18;
  if (type === 'core' || type === 'Topic') return 28;
  if (type === 'Module') return 22;
  return 18;
}

/**
 * 把输入数据拍平成 ECharts graph 的 data / links。
 * 兼容多种输入格式：
 *   1. { nodes/entities: [...], edges/relations/links: [...] }  ← 标准图数据
 *   2. 嵌套 tree（有 children）
 *   3. 字符串（JSON）
 */
function normalizeGraph(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch (e) { return { nodes: [], links: [] }; }
  }
  if (!data) return { nodes: [], links: [] };

  // 解包常见嵌套格式：{ graph: {...} }, { data: {...} }, { subgraph: {...} }
  if (!data.nodes && !data.entities && !data.children && !data.name && !data.title && !data.label) {
    if (data.graph) data = data.graph;
    else if (data.data) data = data.data;
    else if (data.subgraph) data = data.subgraph;
  }

  // 情况1：已有 nodes/entities + edges/relations/links（对齐教师端的 entities/relations 字段）
  const nodeList = data.nodes || data.entities;
  const edgeList = data.edges || data.relations || data.links;
  if (nodeList && Array.isArray(nodeList)) {
    // 构建 name→id 映射，用于修正边引用
    const nameToId = {};
    const nodes = nodeList.map((n, i) => {
      const nid = n.id || n.node_id || n.knowledge_id || `n${i}`;
      const nname = (n.label || n.title || n.name || `节点${i}`).length > 16
        ? (n.label || n.title || n.name || `节点${i}`).slice(0, 16) + '…'
        : (n.label || n.title || n.name || `节点${i}`);
      // 建立多种名称映射
      nameToId[nid] = nid;
      if (n.label) nameToId[n.label] = nid;
      if (n.title) nameToId[n.title] = nid;
      if (n.name) nameToId[n.name] = nid;
      // 截断后的名字也要映射
      if (nname !== nid) nameToId[nname] = nid;
      return {
        id: nid, name: nname,
        symbolSize: n.symbolSize || typeSize(n.type || n.category),
        category: n.type || n.category || '知识点',
        itemStyle: {
          color: masteryColor(n.mastery ?? n.master_score ?? n.score),
          borderWidth: 2, borderColor: '#fff',
          shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.08)',
        },
        _raw: n,
        _mastery: n.mastery ?? n.master_score ?? n.score,
        _desc: n.desc || n.content || n.description || '',
        _type: n.type || n.category || 'knowledge_point',
      };
    });
    const links = (edgeList || []).map((e, i) => {
      const rel = e.relation || e.type || 'default';
      const style = EDGE_STYLE[rel] || EDGE_STYLE.default;
      // 尝试多种边源/目标字段名
      let src = e.from || e.source || e.source_id || e.fromId || e.from_id || e.from_node || e.sourceId || '';
      let tgt = e.to || e.target || e.target_id || e.toId || e.to_id || e.to_node || e.targetId || '';
      // 如果边引用的不是节点 id 而是 name/label，自动修正
      if (!nameToId[src] && src) { const match = Object.keys(nameToId).find(k => k === src || k.startsWith(src)); if (match) src = nameToId[match]; }
      else if (nameToId[src]) src = nameToId[src];
      if (!nameToId[tgt] && tgt) { const match = Object.keys(nameToId).find(k => k === tgt || k.startsWith(tgt)); if (match) tgt = nameToId[match]; }
      else if (nameToId[tgt]) tgt = nameToId[tgt];
      return {
        source: src, target: tgt,
        label: { show: true, fontSize: 9, color: '#999', formatter: rel !== 'default' ? rel : '', distance: 5 },
        lineStyle: { color: style.color, width: style.width, type: style.type, curveness: 0.2, opacity: 0.6 },
        _relation: rel, _label: style.label,
      };
    });
    return { nodes, links };
  }

  // 情况2：嵌套树（递归拍平）
  if (data.children || data.name || data.title || data.label) {
    const nodes = [];
    const links = [];
    let idCounter = 0;
    function walk(node, parentId) {
      const myId = node.id || node.node_id || node.knowledge_id || `tk${idCounter++}`;
      const nType = node.type || '';
      nodes.push({
        id: myId,
        name: (node.name || node.title || node.label || `节点${idCounter}`).length > 16
          ? (node.name || node.title || node.label || `节点${idCounter}`).slice(0, 16) + '…'
          : (node.name || node.title || node.label || `节点${idCounter}`),
        symbolSize: parentId ? typeSize(nType) || 16 : 34,
        category: nType || '知识点',
        itemStyle: {
          color: masteryColor(node.mastery ?? node.master_score),
          borderWidth: 2,
          borderColor: '#fff',
          shadowBlur: 6,
          shadowColor: 'rgba(0,0,0,0.08)',
        },
        _raw: node,
        _mastery: node.mastery ?? node.master_score,
        _desc: node.desc || node.content || node.description || '',
        _type: nType || 'knowledge_point',
      });
      if (parentId) {
        links.push({
          source: parentId, target: myId,
          label: { show: false },
          lineStyle: { color: '#d1d5db', width: 0.8, type: 'solid', curveness: 0.2, opacity: 0.6 },
          _relation: 'belongs_to',
          _label: '所属',
        });
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(ch => walk(ch, myId));
      }
    }
    walk(data, null);
    return { nodes, links };
  }

  return { nodes: [], links: [] };
}

export default function SmallKGNetwork({ data, onNodeClick, highlightNodeId }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [viewMode, setViewMode] = useState('force'); // force | radial
  const [legendCollapsed, setLegendCollapsed] = useState(false);

  // ── 构建 ECharts option ──
  const buildOption = useCallback((nodes, links, mode) => {
    const isRadial = mode === 'radial';

    // DEBUG: 打印数据诊断信息
    console.log('[SmallKGNetwork] buildOption called:',
      'nodes:', nodes.length,
      'links:', links.length,
      'sample node id:', nodes[0]?.id,
      'sample node name:', nodes[0]?.name,
      'sample node category:', nodes[0]?.category,
      'sample link:', links.length > 0 ? { s: links[0].source, t: links[0].target, rel: links[0]._relation } : 'NONE');
    // 检查 link 的 source/target 是否匹配有效节点
    if (links.length > 0) {
      const nodeIds = new Set(nodes.map(n => n.id));
      const nodeNames = new Set(nodes.map(n => n.name));
      let mismatch = 0;
      links.forEach(l => {
        if (!nodeIds.has(l.source) && !nodeNames.has(l.source)) mismatch++;
        if (!nodeIds.has(l.target) && !nodeNames.has(l.target)) mismatch++;
      });
      if (mismatch > 0) console.warn('[SmallKGNetwork] Link mismatch count:', mismatch, '/', links.length * 2);
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          if (p.dataType === 'node') {
            const d = p.data;
            const m = d._mastery;
            const ml = masteryLabel(m);
            let html = `<b style="font-size:13px;">${d.name}</b>`;
            if (m != null) {
              const color = masteryColor(m);
              html += `<br/>掌握度: <span style="color:${color};font-weight:600">${Math.round(m * 100)}%</span> <span style="color:${color}">(${ml})</span>`;
            }
            if (d._type) html += `<br/>类型: <span style="color:#9ca3af">${d._type}</span>`;
            if (d._desc) html += `<br/><span style="color:#9ca3af;font-size:11px">${d._desc.length > 60 ? d._desc.slice(0,60)+'…' : d._desc}</span>`;
            html += '<br/><span style="color:#c4b5fd;font-size:10px">💡 点击查看详情</span>';
            return html;
          }
          if (p.dataType === 'edge') {
            const e = p.data;
            return `<b>${e._label || '关联'}</b><br/>${e.source} → ${e.target}`;
          }
          return '';
        },
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#374151', fontSize: 12 },
      },
      series: [{
        type: 'graph',
        layout: isRadial ? 'circular' : 'force',
        roam: true,
        draggable: true,
        data: nodes,
        links,
        force: isRadial ? undefined : {
          repulsion: 400,
          gravity: 0.08,
          edgeLength: [100, 280],
          friction: 0.6,
          layoutAnimation: true,
        },
        circular: isRadial ? { rotateLabel: true } : undefined,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3, opacity: 1 },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(114,46,209,0.4)' },
          label: { fontSize: 14, fontWeight: 'bold' },
        },
        scaleLimit: { min: 0.4, max: 4 },
        lineStyle: { color: '#aaa', width: 1.2, opacity: 0.7, curveness: 0.2 },
        label: {
          show: true,
          position: 'right',
          distance: 5,
          fontSize: 10,
          color: '#444',
          fontWeight: 'bold',
          formatter: (p) => p.data.name,
        },
        edgeSymbol: ['none', 'none'],
      }],
    };
  }, [highlightNodeId]);

  // ── 初始化 & 数据更新 ──
  useEffect(() => {
    if (!containerRef.current) return;

    // DEBUG: 打印原始数据诊断
    console.log('[SmallKGNetwork] useEffect triggered, raw data type:', typeof data,
      'is null:', data === null,
      'keys:', data ? Object.keys(data) : 'N/A');
    if (data) {
      const nl = data.nodes || data.entities;
      const el = data.edges || data.relations || data.links;
      console.log('[SmallKGNetwork] nodeList length:', nl?.length || 0,
        'edgeList length:', el?.length || 0);
      if (nl?.length > 0) console.log('[SmallKGNetwork] first raw node:', JSON.stringify(nl[0]).slice(0, 200));
      if (el?.length > 0) console.log('[SmallKGNetwork] first raw edge:', JSON.stringify(el[0]));
    }

    const { nodes, links } = normalizeGraph(data);
    if (nodes.length === 0) return;

    // dispose old
    if (chartRef.current) { chartRef.current.dispose(); chartRef.current = null; }

    const inst = echarts.init(containerRef.current, null, { renderer: 'canvas' });
    chartRef.current = inst;

    inst.setOption(buildOption(nodes, links, viewMode), true);

    const onResize = () => inst.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); inst.dispose(); chartRef.current = null; };
  }, [data, viewMode, buildOption]);

  // ── 点击事件 ──
  useEffect(() => {
    const inst = chartRef.current;
    if (!inst || !onNodeClick) return;
    const handler = (params) => {
      if (params.dataType === 'node' && params.data?._raw) {
        onNodeClick(params.data._raw, params.data);
      }
    };
    inst.on('click', handler);
    return () => inst.off('click', handler);
  }, [onNodeClick]);

  // ── 重置视图 ──
  const handleResetView = () => {
    const inst = chartRef.current;
    if (!inst) return;
    inst.dispatchAction({ type: 'restore' });
  };

  if (!data) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#9ca3af',fontSize:14 }}>
        暂无图谱数据
      </div>
    );
  }

  const { nodes, links } = normalizeGraph(data);
  if (nodes.length === 0) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#9ca3af',fontSize:14 }}>
        图谱数据为空
      </div>
    );
  }

  const nodeCount = nodes.length;
  const edgeCount = links.length;
  const edgeTypes = [...new Set(links.map(l => l._relation).filter(Boolean))];
  const hasMastery = nodes.some(n => n._mastery != null);

  return (
    <div className="skg-network-wrapper">
      {/* 左上角提示 */}
      <div className="skg-network-hint">
        {nodeCount} 知识点 · {edgeCount} 关系 · 拖拽/滚轮
      </div>

      {/* 右上角工具栏 */}
      <div className="skg-network-toolbar">
        <button
          className={`skg-network-btn ${viewMode === 'force' ? 'active' : ''}`}
          onClick={() => setViewMode('force')}
        >
          力导向
        </button>
        <button
          className={`skg-network-btn ${viewMode === 'radial' ? 'active' : ''}`}
          onClick={() => setViewMode('radial')}
        >
          环形
        </button>
        <button
          className="skg-network-btn"
          onClick={() => setLegendCollapsed(!legendCollapsed)}
        >
          {legendCollapsed ? '展开图例' : '收起图例'}
        </button>
        <button className="skg-network-btn" onClick={handleResetView}>
          重置视图
        </button>
      </div>

      {/* 左下角图例 */}
      {!legendCollapsed && (
        <div className="skg-network-legend">
          {hasMastery && (
            <>
              <span className="skg-network-legend-item">
                <span style={{ width:10,height:10,borderRadius:'50%',background:'#10b981',display:'inline-block' }} /> 掌握≥80%
              </span>
              <span className="skg-network-legend-item">
                <span style={{ width:10,height:10,borderRadius:'50%',background:'#f59e0b',display:'inline-block' }} /> 一般50-80%
              </span>
              <span className="skg-network-legend-item">
                <span style={{ width:10,height:10,borderRadius:'50%',background:'#ef4444',display:'inline-block' }} /> 薄弱&lt;50%
              </span>
              <span style={{ color: '#d1d5db' }}>|</span>
            </>
          )}
          {edgeTypes.map(et => {
            const style = EDGE_STYLE[et] || EDGE_STYLE.default;
            return (
              <span key={et} className="skg-network-legend-item">
                <span style={{
                  width: 18, height: 0,
                  borderTop: `${style.width}px ${style.type} ${style.color}`,
                  display: 'inline-block', verticalAlign: 'middle',
                }} /> {style.label}
              </span>
            );
          })}
        </div>
      )}

      {/* 图表 */}
      <div ref={containerRef} className="skg-network-chart" />
    </div>
  );
}

export { masteryColor, masteryLabel, normalizeGraph };
