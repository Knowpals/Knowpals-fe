import { useState } from 'react';
import { Tag } from 'antd';
import { injectStyles } from '../utils/injectStyles';

injectStyles('graph-node', `
  .gn-node-v2 { position: relative; }
  .gn-children-v2 { position: relative; }
  /* 树形连线 */
  .gn-children-v2::before {
    content: ''; position: absolute; top: 0; left: 10px;
    width: 2px; height: 100%;
    background: linear-gradient(to bottom, #d1d5db 0%, #e5e7eb 100%);
    border-radius: 1px;
  }
  .gn-row-v2 {
    display: flex; align-items: center; padding: 8px 12px 8px 10px;
    border-radius: 8px; cursor: default; transition: background 0.15s;
    position: relative; margin-bottom: 1px;
  }
  /* 节点行与竖线的连接横线 */
  .gn-row-v2.has-children::after {
    content: ''; position: absolute; bottom: -1px; left: 10px;
    width: 16px; height: 2px;
    background: #d1d5db; border-radius: 1px;
  }
  .gn-row-v2:hover { background: #f5f3ff; }
  .gn-row-v2.clickable { cursor: pointer; }
  .gn-row-v2.selected { background: #ede9fe; }
  .gn-arrow-v2 {
    font-size: 10px; color: #9ca3af; margin-right: 6px;
    transition: transform 0.2s; display: inline-flex;
    align-items: center; justify-content: center;
    width: 18px; height: 18px; flex-shrink: 0;
  }
  .gn-arrow-v2.open { transform: rotate(90deg); color: #7c3aed; }
  .gn-dot-v2 {
    width: 12px; height: 12px; border-radius: 50%;
    margin-right: 10px; flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    transition: box-shadow 0.2s;
  }
  .gn-dot-v2.mastered { box-shadow: 0 1px 4px rgba(16,185,129,0.4); }
  .gn-dot-v2.average { box-shadow: 0 1px 4px rgba(245,158,11,0.4); }
  .gn-dot-v2.weak { box-shadow: 0 1px 4px rgba(239,68,68,0.4); }
  .gn-name-v2 { font-size: 14px; color: #1f2937; font-weight: 500; }
  .gn-desc-v2 { font-size: 11px; color: #9ca3af; margin-left: 8px; }
`);

const masteryColor = (val) => {
  if (val >= 0.8) return '#10b981';
  if (val >= 0.5) return '#f59e0b';
  return '#ef4444';
};

const masteryLevel = (val) => {
  if (val >= 0.8) return 'mastered';
  if (val >= 0.5) return 'average';
  return 'weak';
};

export default function GraphNode({ node, depth = 0, defaultExpanded = true, onNodeClick, selectedNode }) {
  const [expanded, setExpanded] = useState(depth < 2 ? defaultExpanded : false);
  const hasChildren = node.children && node.children.length > 0;
  const mColor = masteryColor(node.mastery || 0);
  const mLevel = masteryLevel(node.mastery || 0);
  const isSelected = selectedNode && (selectedNode.name === node.name || selectedNode.title === node.title);

  const handleRowClick = () => {
    if (hasChildren) setExpanded(!expanded);
    if (onNodeClick) onNodeClick(node);
  };

  return (
    <div className="gn-node-v2" style={{ paddingLeft: depth * 24 }}>
      <div
        className={`gn-row-v2 ${hasChildren ? 'has-children' : ''} ${hasChildren || onNodeClick ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={handleRowClick}
      >
        {hasChildren ? (
          <span className={`gn-arrow-v2 ${expanded ? 'open' : ''}`}>&#9654;</span>
        ) : (
          <span className="gn-arrow-v2" />
        )}
        <div className={`gn-dot-v2 ${mLevel}`} style={{ background: mColor }} />
        <span className="gn-name-v2">{node.name || node.title}</span>
        {node.desc && <span className="gn-desc-v2">{node.desc}</span>}
        {node.mastery !== undefined && (
          <Tag
            color={node.mastery >= 0.8 ? 'green' : node.mastery >= 0.5 ? 'gold' : 'red'}
            style={{ fontSize: 11, marginLeft: 8 }}
          >
            {Math.round(node.mastery * 100)}%
          </Tag>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="gn-children-v2">
          {node.children.map((child, idx) => (
            <GraphNode
              key={child.id || child.name || idx}
              node={child}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
              onNodeClick={onNodeClick}
              selectedNode={selectedNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { masteryColor, masteryLevel };
