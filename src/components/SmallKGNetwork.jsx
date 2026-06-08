import { useEffect, useRef, useState, useCallback } from 'react';
import * as echarts from 'echarts';
import { injectStyles } from '../utils/injectStyles';

injectStyles('small-kg-network', `
  .skg-network-wrapper { width: 100%; position: relative; }
  .skg-network-chart { width: 100%; height: 480px; }
  @media (min-width: 481px) { .skg-network-chart { height: 560px; } }
  .skg-network-toolbar { position: absolute; top: 8px; right: 12px; z-index: 10; display: flex; gap: 6px; }
  .skg-network-btn { padding: 4px 12px; border-radius: 14px; border: 1px solid #d1d5db; background: #fff; font-size: 11px; color: #6b7280; cursor: pointer; transition: all 0.15s; }
  .skg-network-btn:hover { border-color: #7c3aed; color: #7c3aed; }
  .skg-network-btn.active { border-color: #7c3aed; background: #f5f3ff; color: #7c3aed; }
  .skg-network-legend {
    position: absolute; bottom: 8px; left: 12px; z-index: 10;
    display: flex; gap: 12px; flex-wrap: wrap;
    font-size: 11px; color: #6b7280; background: rgba(255,255,255,0.88);
    padding: 5px 10px; border-radius: 8px; pointer-events: none;
  }
  .skg-network-legend-item { display: flex; align-items: center; gap: 4px; }
  .skg-network-hint { position: absolute; top: 10px; left: 12px; z-index: 10; font-size: 11px; color: #9ca3af; pointer-events: none; }
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

// ── 边类型配色 ──
const EDGE_STYLE = {
  prerequisite: { color: '#a78bfa', width: 1.6, type: 'solid', label: '前置依赖' },
  strong_prerequisite: { color: '#7c3aed', width: 2.2, type: 'solid', label: '强前置' },
  weak_prerequisite: { color: '#c4b5fd', width: 1.0, type: 'solid', label: '弱前置' },
  similar_to: { color: '#facc15', width: 1.0, type: 'dashed', label: '相似' },
  confused_with: { color: '#fb923c', width: 1.0, type: 'dashed', label: '易混淆' },
  belongs_to: { color: '#d1d5db', width: 0.8, type: 'dotted', label: '所属' },
  default: { color: '#d1d5db', width: 1.0, type: 'solid', label: '关联' },
};

/**
 * 把一棵树形 data（或 {nodes, edges}）拍平成 ECharts graph 的 data / links。
 * 兼容三种输入：
 *   1. { nodes: [...], edges: [...] }   ← 标准图数据
 *   2. 嵌套 tree（有 children）
 *   3. 字符串（JSON）
 */
function normalizeGraph(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch (e) { return { nodes: [], links: [] }; }
  }
  if (!data) return { nodes: [], links: [] };

  // 情况1：已有 nodes + edges
  if (data.nodes && Array.isArray(data.nodes)) {
    const nodes = data.nodes.map((n, i) => ({
      id: n.id || n.knowledge_id || `n${i}`,
      name: (n.label || n.title || n.name || `节点${i}`).length > 16
        ? (n.label || n.title || n.name || `节点${i}`).slice(0, 16) + '…'
        : (n.label || n.title || n.name || `节点${i}`),
      symbolSize: n.symbolSize || (n.type === 'Module' || n.is_module ? 36 : 18),
      itemStyle: { color: masteryColor(n.mastery ?? n.master_score ?? n.score) },
      _raw: n,
      _mastery: n.mastery ?? n.master_score ?? n.score,
      _desc: n.desc || n.content || n.description || '',
      _type: n.type || 'knowledge_point',
    }));
    const links = (data.edges || data.links || []).map((e, i) => {
      const rel = e.relation || e.type || 'default';
      const style = EDGE_STYLE[rel] || EDGE_STYLE.default;
      return {
        source: e.from || e.source || '',
        target: e.to || e.target || '',
        lineStyle: { color: style.color, width: style.width, type: style.type, curveness: 0.2 },
        _relation: rel,
        _label: style.label,
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
      const myId = node.id || node.knowledge_id || `tk${idCounter++}`;
      nodes.push({
        id: myId,
        name: (node.name || node.title || node.label || `节点${idCounter}`).length > 16
          ? (node.name || node.title || node.label || `节点${idCounter}`).slice(0, 16) + '…'
          : (node.name || node.title || node.label || `节点${idCounter}`),
        symbolSize: parentId ? 14 : 32,
        itemStyle: { color: masteryColor(node.mastery ?? node.master_score) },
        _raw: node,
        _mastery: node.mastery ?? node.master_score,
        _desc: node.desc || node.content || node.description || '',
      });
      if (parentId) {
        links.push({
          source: parentId, target: myId,
          lineStyle: { color: '#d1d5db', width: 0.8, type: 'solid', curveness: 0.2 },
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
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          if (p.dataType === 'node') {
            const d = p.data;
            const m = d._mastery;
            const ml = masteryLabel(m);
            let html = `<b>${d.name}</b>`;
            if (m != null) html += `<br/>掌握度: ${Math.round(m * 100)}% <span style="color:${masteryColor(m)}">(${ml})</span>`;
            if (d._desc) html += `<br/><span style="color:#9ca3af;font-size:11px">${d._desc.length > 60 ? d._desc.slice(0,60)+'…' : d._desc}</span>`;
            if (d._type) html += `<br/>类型: ${d._type}`;
            html += '<br/><span style="color:#9ca3af;font-size:10px">点击查看详情</span>';
            return html;
          }
          if (p.dataType === 'edge') {
            const e = p.data;
            return `${e._label || '关联'}: ${e.source} → ${e.target}`;
          }
          return '';
        },
      },
      series: [{
        type: 'graph',
        layout: isRadial ? 'circular' : 'force',
        roam: true,
        draggable: true,
        data: nodes,
        links,
        force: isRadial ? undefined : {
          repulsion: 350,
          gravity: 0.08,
          edgeLength: [80, 280],
          friction: 0.6,
          layoutAnimation: true,
        },
        circular: isRadial ? { rotateLabel: true } : undefined,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3 },
          itemStyle: { shadowBlur: 18, shadowColor: 'rgba(124,58,237,0.35)' },
        },
        scaleLimit: { min: 0.3, max: 5 },
        lineStyle: { opacity: 0.35, curveness: 0.2 },
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#374151',
          fontWeight: 'bold',
          formatter: (p) => p.data.name,
        },
        edgeSymbol: ['none', 'none'],
        // 初始聚焦到指定节点
        center: highlightNodeId
          ? nodes.find(n => n.id === highlightNodeId) ? undefined : undefined
          : undefined,
      }],
    };
  }, [highlightNodeId]);

  // ── 初始化 & 数据更新 ──
  useEffect(() => {
    if (!containerRef.current) return;
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

  if (!data) {
    return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#9ca3af',fontSize:14 }}>暂无图谱数据</div>;
  }

  const { nodes, links } = normalizeGraph(data);
  if (nodes.length === 0) {
    return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#9ca3af',fontSize:14 }}>图谱数据为空</div>;
  }

  const nodeCount = nodes.length;
  const edgeCount = links.length;
  const edgeTypes = [...new Set(links.map(l => l._relation).filter(Boolean))];
  const hasMastery = nodes.some(n => n._mastery != null);

  return (
    <div className="skg-network-wrapper">
      {/* 提示 */}
      <div className="skg-network-hint">
        {nodeCount} 知识点 · {edgeCount} 关系 · 拖拽/滚轮
      </div>

      {/* 工具栏 */}
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
      </div>

      {/* 图例 */}
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
                  width: 16, height: 0, borderTop: `${style.width}px ${style.type} ${style.color}`,
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
