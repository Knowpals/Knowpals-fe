// 统一返回箭头组件 — 所有独立页面共用
export default function BackArrow({ onClick, style }) {
  return (
    <div onClick={onClick} style={{
      width: 34, height: 34, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(4px)', transition: 'background 0.15s',
      flexShrink: 0, ...style,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </div>
  );
}
