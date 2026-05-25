import { injectStyles } from '../utils/injectStyles';

injectStyles('mastery-bar', `
  .mastery-bar-item-v2 { display: flex; flex-direction: column; gap: 5px; }
  .mastery-bar-info-v2 { display: flex; justify-content: space-between; align-items: center; }
  .mastery-bar-name-v2 { font-size: 13px; color: #333; font-weight: 500; }
  .mastery-bar-rate-v2 { font-size: 13px; font-weight: 600; color: #333; }
  .mastery-bar-track-v2 { width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .mastery-bar-fill-v2 { height: 100%; border-radius: 4px; transition: width 0.3s; }
`);

const defaultColor = (rate) => {
  if (rate >= 80) return '#10b981';
  if (rate >= 50) return '#f59e0b';
  return '#ef4444';
};

export default function MasteryBar({ label, rate, color }) {
  const barColor = color || defaultColor(rate);

  return (
    <div className="mastery-bar-item-v2">
      <div className="mastery-bar-info-v2">
        <span className="mastery-bar-name-v2">{label}</span>
        <span className="mastery-bar-rate-v2">{rate}%</span>
      </div>
      <div className="mastery-bar-track-v2">
        <div className="mastery-bar-fill-v2" style={{ width: `${rate}%`, background: barColor }} />
      </div>
    </div>
  );
}
