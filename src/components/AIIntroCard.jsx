import { useNavigate } from 'react-router-dom';
import { injectStyles } from '../utils/injectStyles';

injectStyles('ai-intro-card', `
  .ai-intro-card-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    border-radius: 12px; padding: 16px; margin-bottom: 12px;
    color: #fff; box-shadow: 0 2px 12px rgba(124,58,237,0.25);
  }
  .ai-intro-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .ai-intro-title-v2 { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .ai-intro-link-v2 { font-size: 12px; opacity: 0.9; cursor: pointer; }
  .ai-intro-features-v2 { display: flex; gap: 8px; flex-wrap: wrap; }
  .ai-intro-feature-v2 {
    background: rgba(255,255,255,0.2); border-radius: 8px;
    padding: 8px 12px; font-size: 12px; display: flex;
    align-items: center; gap: 6px; backdrop-filter: blur(4px);
  }
`);

const features = [
  { icon: '💬', text: '知识答疑' },
  { icon: '📝', text: '智能出题' },
  { icon: '📊', text: '学情分析' },
  { icon: '🗺️', text: '知识导航' },
];

export default function AIIntroCard() {
  const navigate = useNavigate();

  return (
    <div className="ai-intro-card-v2">
      <div className="ai-intro-header-v2">
        <span className="ai-intro-title-v2">🤖 AI 学习助手</span>
        <span className="ai-intro-link-v2" onClick={() => navigate('/student/chat')}>
          立即体验 →
        </span>
      </div>
      <div className="ai-intro-features-v2">
        {features.map(f => (
          <span key={f.text} className="ai-intro-feature-v2">
            {f.icon} {f.text}
          </span>
        ))}
      </div>
    </div>
  );
}
