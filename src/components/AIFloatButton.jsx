import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { injectStyles } from '../utils/injectStyles';

injectStyles('ai-float-btn', `
  .ai-float-btn-v2 {
    position: fixed; bottom: 24px; right: 24px; z-index: 9990;
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: none; transition: transform 0.2s, box-shadow 0.2s;
    animation: ai-float-pulse 2s ease-in-out infinite;
  }
  .ai-float-btn-v2:active { transform: scale(0.9); }
  .ai-float-btn-v2:hover { box-shadow: 0 6px 28px rgba(124,58,237,0.5); }
  .ai-float-icon-v2 { font-size: 24px; color: #fff; line-height: 1; }
  .ai-float-tooltip-v2 {
    position: fixed; bottom: 84px; right: 24px; z-index: 9989;
    background: #fff; border-radius: 10px; padding: 8px 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    font-size: 12px; color: #333; white-space: nowrap;
    animation: slideUp 0.3s ease;
    pointer-events: none;
  }
  .ai-float-tooltip-v2::after {
    content: ''; position: absolute; bottom: -6px; right: 20px;
    width: 0; height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #fff;
  }
  @keyframes ai-float-pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(124,58,237,0.35); }
    50% { box-shadow: 0 4px 28px rgba(124,58,237,0.55); }
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @media (min-width: 481px) {
    .ai-float-btn-v2 { right: 32px; bottom: 32px; width: 56px; height: 56px; }
    .ai-float-tooltip-v2 { right: 32px; bottom: 96px; }
  }
`);

export default function AIFloatButton({ onClick }) {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(true);

  const handleClick = () => {
    setShowTooltip(false);
    if (onClick) {
      onClick();
    } else {
      navigate('/student/chat');
    }
  };

  return (
    <>
      {showTooltip && (
        <div className="ai-float-tooltip-v2" onClick={() => setShowTooltip(false)}>
          AI 学习助手 · 点击咨询
        </div>
      )}
      <button className="ai-float-btn-v2" onClick={handleClick} title="AI 学习助手">
        <span className="ai-float-icon-v2">🤖</span>
      </button>
    </>
  );
}
