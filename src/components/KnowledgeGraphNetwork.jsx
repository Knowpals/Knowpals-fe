import { useEffect, useRef, useState, useCallback } from 'react';
import * as echarts from 'echarts';
import { injectStyles } from '../utils/injectStyles';

injectStyles('kg-network', `
  .kg-network-container { width: 100%; min-height: 600px; position: relative; }
  .kg-network-chart { width: 100%; height: 600px; }
  .kg-network-toolbar { position: absolute; top: 8px; right: 12px; z-index: 10; display: flex; gap: 8px; }
  .kg-network-btn { padding: 4px 14px; border-radius: 14px; border: 1px solid #d1d5db; background: #fff; font-size: 12px; color: #6b7280; cursor: pointer; transition: all 0.15s; }
  .kg-network-btn:hover { border-color: #7c3aed; color: #7c3aed; }
  .kg-network-hint { position: absolute; top: 10px; left: 12px; z-index: 10; font-size: 12px; color: #9ca3af; pointer-events: none; }
`);

const COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899','#6366f1','#14b8a6','#a3e635','#fb923c','#d946ef','#4f46e5','#0ea5e9','#22c55e','#eab308','#f43f5e'];

export default function KnowledgeGraphNetwork({ tree, edges, onNodeClick }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [linkCount, setLinkCount] = useState(0);

  // 缓存模块节点位置，用于放置子节点
  const modulePositions = useRef({});

  // ── 构建数据 ──
  const buildData = useCallback((treeData, edgeList, expanded) => {
    const nodes = [];
    const links = [];
    const modLabelToIdx = {};
    const modInternal = {};

    if (!treeData?.children) return { nodes, links };

    // 1. 模块节点（始终显示）
    treeData.children.forEach((m, i) => {
      if (m.type !== 'Module') return;
      let totalKids = 0;
      if (m.children) m.children.forEach(g => { totalKids += g.children?.length || 0; });
      modLabelToIdx[m.label] = i;
      modInternal[m.label] = 0;
      nodes.push({
        id: m.id, name: m.label, symbolSize: 42,
        itemStyle: { color: COLORS[i % COLORS.length] },
        _type: 'Module', _label: m.label, _nodeCount: totalKids, _internalPrereq: 0,
      });
    });

    // 2. 聚合边：prerequisite + similar/confused
    const prereqAgg = {};    // prerequisite 聚合
    const similarAgg = {};   // similar_to / confused_with 聚合
    if (edgeList) {
      edgeList.forEach(e => {
        const si = modLabelToIdx[e.fromModule];
        const ti = modLabelToIdx[e.toModule];
        if (si === undefined || ti === undefined) return;

        if (e.relation === 'strong_prerequisite' || e.relation === 'weak_prerequisite') {
          if (si === ti) { modInternal[e.fromModule] = (modInternal[e.fromModule] || 0) + 1; return; }
          const k = `${Math.min(si,ti)}|${Math.max(si,ti)}`;
          if (!prereqAgg[k]) prereqAgg[k] = { src: Math.min(si,ti), tgt: Math.max(si,ti), strong: 0, weak: 0 };
          if (e.relation === 'strong_prerequisite') prereqAgg[k].strong++; else prereqAgg[k].weak++;
        } else if (e.relation === 'similar_to' || e.relation === 'confused_with') {
          const k = `${Math.min(si,ti)}|${Math.max(si,ti)}`;
          if (!similarAgg[k]) similarAgg[k] = { src: Math.min(si,ti), tgt: Math.max(si,ti), similar: 0, confused: 0 };
          if (e.relation === 'similar_to') similarAgg[k].similar++; else similarAgg[k].confused++;
        }
      });
    }
    nodes.forEach(n => { if (n._type === 'Module') n._internalPrereq = modInternal[n._label] || 0; });

    // 添加 prerequisite 边
    Object.values(prereqAgg).forEach(v => {
      const total = v.strong + v.weak;
      links.push({
        source: nodes[v.src].id, target: nodes[v.tgt].id,
        lineStyle: { color: v.strong > 0 ? '#a78bfa' : '#d1d5db', width: Math.min(total * 0.8, 5), curveness: 0.2 },
        _type: 'prereq', _count: total, _strong: v.strong, _weak: v.weak,
      });
    });

    // 添加 similar/confused 边（黄色虚线/橙色虚线）
    Object.values(similarAgg).forEach(v => {
      const total = v.similar + v.confused;
      links.push({
        source: nodes[v.src].id, target: nodes[v.tgt].id,
        lineStyle: { color: v.confused > 0 ? '#fb923c' : '#facc15', width: Math.min(total * 0.6, 3), type: 'dashed', curveness: 0.3 },
        _type: 'similar', _count: total, _similar: v.similar, _confused: v.confused,
      });
    });

    setLinkCount(Object.keys(prereqAgg).length + Object.keys(similarAgg).length);

    // 3. 展开的模块：添加子节点，初始位置靠近父模块
    if (expanded.size > 0 && treeData.children) {
      treeData.children.forEach(mod => {
        if (mod.type !== 'Module' || !expanded.has(mod.id) || !mod.children) return;
        const parentPos = modulePositions.current[mod.id];
        const px = parentPos ? parentPos[0] : (Math.random() - 0.5) * 200;
        const py = parentPos ? parentPos[1] : (Math.random() - 0.5) * 200;

        mod.children.forEach(group => {
          if (!group.children) return;
          group.children.forEach((leaf, j) => {
            const angle = (j / group.children.length) * Math.PI * 2;
            const r = 60 + Math.random() * 40;
            nodes.push({
              id: leaf.id, name: leaf.label, symbolSize: 10,
              category: mod.label,
              x: px + Math.cos(angle) * r,  // 初始位置固定在父节点周围
              y: py + Math.sin(angle) * r,
              fixed: false,
              itemStyle: { color: COLORS[nodes.findIndex(n => n.id === mod.id) % COLORS.length], opacity: 0.65 },
              _type: leaf.type, _module: mod.label, _label: leaf.label,
            });
          });
        });
      });

      // 子节点之间的边（prerequisite + similar/confused）
      const allIds = new Set(nodes.map(n => n.id));
      if (edgeList) {
        edgeList.forEach(e => {
          if (allIds.has(e.from) && allIds.has(e.to)) {
            if (e.relation === 'strong_prerequisite' || e.relation === 'weak_prerequisite') {
              links.push({
                source: e.from, target: e.to,
                lineStyle: { color: e.relation === 'strong_prerequisite' ? '#c4b5fd' : '#e5e7eb', width: 0.7, curveness: 0.2 },
              });
            } else if (e.relation === 'similar_to' || e.relation === 'confused_with') {
              links.push({
                source: e.from, target: e.to,
                lineStyle: { color: e.relation === 'confused_with' ? '#fb923c' : '#facc15', width: 0.6, type: 'dashed', curveness: 0.3 },
              });
            }
          }
        });
      }
    }

    return { nodes, links };
  }, []);

  // ── ECharts option ──
  function getOption(nodes, links) {
    return {
      tooltip: {
        formatter: (p) => {
          if (p.dataType === 'node') {
            const d = p.data;
            if (d._type === 'Module') return `<b>${d._label}</b><br/>${d._nodeCount} 知识点 · ${d._internalPrereq || 0} 内部依赖<br/>点击展开/收起`;
            return `<b>${d._label}</b><br/>${d._type || ''} · ${d._module || ''}`;
          }
          if (p.dataType === 'edge' && p.data._type === 'prereq') return `前后置依赖: ${p.data._count} 条<br/>强前置 ${p.data._strong} · 弱前置 ${p.data._weak}`;
          if (p.dataType === 'edge' && p.data._type === 'similar') return `易混/相似: ${p.data._count} 条<br/>相似 ${p.data._similar} · 易混淆 ${p.data._confused}`;
          return '';
        },
      },
      series: [{
        type: 'graph', layout: 'force', roam: true, draggable: true,
        data: nodes, links,
        force: { repulsion: 500, gravity: 0.06, edgeLength: [100, 400], friction: 0.6, layoutAnimation: true },
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 }, itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0,0,0,0.25)' } },
        scaleLimit: { min: 0.3, max: 5 },
        lineStyle: { opacity: 0.4 },
        label: { show: true, position: 'right', fontSize: 12, color: '#374151', fontWeight: 'bold',
          formatter: (p) => p.data._type === 'Module' ? p.name : (p.name.length > 8 ? p.name.slice(0,8)+'...' : p.name),
        },
        edgeSymbol: ['none', 'none'],
      }],
    };
  }

  // ── 初始化 ──
  useEffect(() => {
    if (!containerRef.current || !tree) return;
    if (chartRef.current) { chartRef.current.dispose(); chartRef.current = null; }

    const inst = echarts.init(containerRef.current, null, { renderer: 'canvas' });
    chartRef.current = inst;

    const { nodes, links } = buildData(tree, edges, new Set());
    inst.setOption(getOption(nodes, links), true);

    // 保存模块节点初始位置
    setTimeout(() => {
      const opt = inst.getOption();
      const seriesData = opt?.series?.[0]?.data;
      if (seriesData) {
        seriesData.forEach(d => {
          if (d._type === 'Module' && d.x !== undefined) {
            modulePositions.current[d.id] = [d.x, d.y];
          }
        });
      }
    }, 1000);

    const onResize = () => inst.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); inst.dispose(); chartRef.current = null; };
  }, [tree, edges, buildData]);

  // ── 保存模块位置 ──
  useEffect(() => {
    const inst = chartRef.current;
    if (!inst) return;
    const timer = setInterval(() => {
      const opt = inst.getOption();
      const data = opt?.series?.[0]?.data;
      if (data) {
        data.forEach(d => {
          if (d._type === 'Module' && d.x !== undefined) {
            modulePositions.current[d.id] = [d.x, d.y];
          }
        });
      }
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // ── 展开/收起时更新 ──
  useEffect(() => {
    const inst = chartRef.current;
    if (!inst || !tree) return;
    const { nodes, links } = buildData(tree, edges, expandedModules);
    inst.setOption(getOption(nodes, links), true);
  }, [expandedModules, tree, edges, buildData]);

  // ── 点击 ──
  useEffect(() => {
    const inst = chartRef.current;
    if (!inst) return;
    const handler = (params) => {
      if (params.dataType === 'node' && params.data?._type === 'Module') {
        setExpandedModules(prev => {
          const next = new Set(prev);
          next.has(params.data.id) ? next.delete(params.data.id) : next.add(params.data.id);
          return next;
        });
      } else if (params.dataType === 'node' && params.data?._type !== 'Module' && onNodeClick) {
        onNodeClick({ id: params.data.id, name: params.data._label, label: params.data._label, type: params.data._type });
      }
    };
    inst.on('click', handler);
    return () => inst.off('click', handler);
  }, [onNodeClick]);

  if (!tree) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:600,color:'#9ca3af',fontSize:14 }}>加载图谱数据中...</div>;

  return (
    <div className="kg-network-container">
      <div className="kg-network-hint">
        20 模块 · {linkCount} 模块间连线 · 点击展开子节点  |  拖拽/滚轮
      </div>
      <div className="kg-network-toolbar">
        {expandedModules.size > 0 && (
          <button className="kg-network-btn" onClick={() => setExpandedModules(new Set())}>收起全部</button>
        )}
      </div>
      {/* 图例 */}
      <div style={{
        position: 'absolute', bottom: 8, left: 12, zIndex: 10,
        display: 'flex', gap: 14, flexWrap: 'wrap',
        fontSize: 11, color: '#6b7280', background: 'rgba(255,255,255,0.85)',
        padding: '6px 12px', borderRadius: 8,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 20, height: 2, background: '#a78bfa', borderRadius: 1 }} /> 强前置
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 20, height: 1, background: '#d1d5db', borderRadius: 1 }} /> 弱前置
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 16, height: 1, background: '#facc15', borderRadius: 1, borderStyle: 'dashed', border: '1px dashed #facc15' }} /> 相似
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 16, height: 1, background: '#fb923c', borderRadius: 1, borderStyle: 'dashed', border: '1px dashed #fb923c' }} /> 易混淆
        </span>
        <span style={{ color: '#9ca3af' }}>| 线越粗 = 关系越多</span>
      </div>
      <div ref={containerRef} className="kg-network-chart" />
    </div>
  );
}
