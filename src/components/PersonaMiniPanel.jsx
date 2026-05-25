import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { injectStyles } from '../utils/injectStyles';
import request from '../utils/request';

injectStyles('persona-mini-panel', `
  .persona-mini-panel-v2 {
    background: #fff; border-radius: 12px; padding: 16px;
    margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .persona-mini-header-v2 {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px;
  }
  .persona-mini-title-v2 { font-size: 15px; font-weight: 600; color: #333; }
  .persona-mini-link-v2 { font-size: 12px; color: #7c3aed; cursor: pointer; }
  .persona-mini-tags-v2 { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .persona-mini-tag-v2 {
    padding: 4px 12px; border-radius: 12px; font-size: 11px;
    font-weight: 500;
  }
  .persona-mini-tag-v2.style { background: #ede9fe; color: #7c3aed; }
  .persona-mini-tag-v2.strength { background: #d1fae5; color: #059669; }
  .persona-mini-tag-v2.weakness { background: #fef3c7; color: #d97706; }
  .persona-mini-dims-v2 { display: flex; gap: 12px; }
  .persona-mini-dim-v2 { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .persona-mini-dim-bar-v2 {
    width: 100%; height: 4px; background: #f0f0f0;
    border-radius: 2px; overflow: hidden;
  }
  .persona-mini-dim-fill-v2 {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
    transition: width 0.5s ease;
  }
  .persona-mini-dim-label-v2 { font-size: 10px; color: #999; }
  .persona-mini-suggestion-v2 {
    margin-top: 12px; padding-top: 12px; border-top: 1px solid #f5f5f5;
    font-size: 12px; color: #6b7280; line-height: 1.5;
  }
  .persona-mini-loading-v2 { text-align: center; padding: 20px; color: #999; font-size: 13px; }
`);

const demoPersona = {
  learning_style: '视觉型',
  strengths: ['计算能力', '逻辑推理'],
  weaknesses: ['应用创新'],
  dimensions: [
    { label: '计算', value: 85 },
    { label: '逻辑', value: 72 },
    { label: '记忆', value: 60 },
    { label: '创新', value: 45 },
  ],
  suggestion: '你的计算能力扎实，建议多尝试开放性问题来提升应用创新能力。',
};

export default function PersonaMiniPanel() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersona();
  }, []);

  const loadPersona = async () => {
    try {
      const res = await request.get('/agent/persona');
      if ((res.code === 0 || res.code === 200) && res.data) {
        setPersona(res.data);
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setPersona(demoPersona);
    setLoading(false);
  };

  if (loading && !persona) {
    return <div className="persona-mini-loading-v2">加载画像中...</div>;
  }

  const d = persona || demoPersona;

  return (
    <div className="persona-mini-panel-v2">
      <div className="persona-mini-header-v2">
        <span className="persona-mini-title-v2">学习画像</span>
        <span className="persona-mini-link-v2" onClick={() => navigate('/student/persona')}>
          查看完整画像 →
        </span>
      </div>

      <div className="persona-mini-tags-v2">
        <span className="persona-mini-tag-v2 style">学习风格: {d.learning_style}</span>
        {d.strengths?.map(s => (
          <span key={s} className="persona-mini-tag-v2 strength">强项: {s}</span>
        ))}
        {d.weaknesses?.map(w => (
          <span key={w} className="persona-mini-tag-v2 weakness">弱项: {w}</span>
        ))}
      </div>

      <div className="persona-mini-dims-v2">
        {d.dimensions?.map(dim => (
          <div key={dim.label} className="persona-mini-dim-v2">
            <div className="persona-mini-dim-bar-v2">
              <div className="persona-mini-dim-fill-v2" style={{ width: `${dim.value}%` }} />
            </div>
            <span className="persona-mini-dim-label-v2">{dim.label}</span>
          </div>
        ))}
      </div>

      {d.suggestion && (
        <div className="persona-mini-suggestion-v2">💡 {d.suggestion}</div>
      )}
    </div>
  );
}
