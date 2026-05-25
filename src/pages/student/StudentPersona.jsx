import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { getStudentPersona } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-persona', `
  .persona-page-v2 { min-height: 100vh; background: #f8f9fa; }
  .persona-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 20px 15px; color: #fff;
    border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(124,58,237,0.3);
  }
  .persona-header-content-v2 { display: flex; align-items: center; gap: 12px; }
  .persona-back-btn-v2 { font-size: 22px; color: #fff; cursor: pointer; width: 30px; text-align: center; }
  .persona-header-title-v2 { font-size: 18px; font-weight: 600; }
  .persona-content-v2 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .persona-content-v2 { max-width: 1200px; padding: 16px 32px; } }
  .persona-section-v2 {
    background: #fff; border-radius: 12px; padding: 16px;
    margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .persona-section-title-v2 { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; }
  .persona-profile-v2 { display: flex; align-items: center; gap: 12px; }
  .persona-avatar-v2 {
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 24px; font-weight: 600; flex-shrink: 0;
  }
  .persona-info-v2 { display: flex; flex-direction: column; gap: 2px; }
  .persona-name-v2 { font-size: 17px; font-weight: 600; color: #333; }
  .persona-meta-v2 { font-size: 12px; color: #999; }
  .persona-tags-v2 { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .persona-tag-v2 {
    padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 500;
  }
  .persona-tag-v2.style { background: #ede9fe; color: #7c3aed; }
  .persona-tag-v2.strength { background: #d1fae5; color: #059669; }
  .persona-tag-v2.weakness { background: #fef3c7; color: #d97706; }
  .persona-radar-v2 { display: flex; flex-direction: column; gap: 10px; }
  .persona-radar-item-v2 { display: flex; align-items: center; gap: 10px; }
  .persona-radar-label-v2 { width: 60px; font-size: 12px; color: #6b7280; text-align: right; }
  .persona-radar-bar-v2 { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .persona-radar-fill-v2 { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .persona-radar-value-v2 { width: 40px; font-size: 12px; font-weight: 600; color: #333; }
  .persona-heatmap-v2 { display: flex; flex-direction: column; gap: 8px; }
  .persona-heatmap-row-v2 { display: flex; align-items: center; gap: 10px; }
  .persona-heatmap-label-v2 { width: 80px; font-size: 12px; color: #6b7280; }
  .persona-heatmap-cells-v2 { display: flex; gap: 4px; flex: 1; }
  .persona-heatmap-cell-v2 {
    width: 24px; height: 24px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: #fff; font-weight: 600;
  }
  .persona-behavior-v2 { display: flex; flex-direction: column; gap: 8px; }
  .persona-behavior-item-v2 { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
  .persona-behavior-label-v2 { color: #6b7280; }
  .persona-behavior-value-v2 { color: #333; font-weight: 500; }
  .persona-suggestion-v2 { font-size: 13px; color: #666; line-height: 1.6; }
  .persona-path-v2 { display: flex; flex-direction: column; gap: 6px; }
  .persona-path-item-v2 {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    background: #f8f9fa; border-radius: 8px; font-size: 13px;
  }
  .persona-path-num-v2 {
    width: 22px; height: 22px; border-radius: 50%;
    background: #7c3aed; color: #fff; display: flex;
    align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; flex-shrink: 0;
  }
  .persona-footer-v2 { display: flex; gap: 12px; margin-top: 4px; }
  .persona-footer-btn-v2 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
    background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff;
  }
`);

const demoPersona = {
  name: '张同学',
  email: 'zhang@example.com',
  school: '某大学',
  major: '计算机科学',
  learning_style: '视觉型',
  strengths: ['计算能力突出', '逻辑推理强', '概念理解快'],
  weaknesses: ['应用创新能力待提升', '数值实验经验少'],
  dimensions: [
    { label: '计算能力', value: 85, color: '#7c3aed' },
    { label: '逻辑推理', value: 72, color: '#7c3aed' },
    { label: '知识记忆', value: 60, color: '#f59e0b' },
    { label: '应用创新', value: 45, color: '#ef4444' },
  ],
  chapters: [
    { name: '插值法', kps: ['概念', 'Lagrange', 'Newton', 'Hermite', '分段', '样条'], scores: [90, 85, 68, 55, 60, 45] },
    { name: '数值积分', kps: ['梯形', 'Simpson', '复化', 'Romberg', 'Gauss'], scores: [80, 75, 65, 50, 48] },
    { name: '方程求根', kps: ['二分', '迭代', 'Newton', '弦截', '收敛性'], scores: [88, 65, 72, 60, 55] },
    { name: '线性方程组', kps: ['Gauss', 'LU', 'Cholesky', 'Jacobi', 'GS', 'SOR'], scores: [85, 70, 60, 55, 50, 40] },
    { name: '特征值', kps: ['幂法', '反幂', 'QR', 'Householder'], scores: [52, 45, 35, 30] },
  ],
  behavior: {
    peak_hours: '晚上 19:00-22:00',
    avg_session_min: 45,
    answer_speed: '中等偏快',
    review_rate: '35%',
  },
  suggestion: '你的计算基础扎实，建议加强数值分析理论证明和编程实现能力。重点关注 Gauss 型积分和特征值的数值方法，可尝试用 Python 实现算法加深理解。',
  learning_path: [
    '巩固插值法基础（Lagrange → Newton → Hermite）',
    '深入数值积分理论（从 Newton-Cotes 到 Gauss 积分）',
    '掌握方程求根各方法收敛性分析',
    '系统学习线性方程组迭代法',
    '逐步攻克特征值数值方法',
  ],
};

function heatColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export default function StudentPersona() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState(null);

  useEffect(() => {
    loadPersona();
  }, []);

  const loadPersona = async () => {
    setLoading(true);
    try {
      const res = await getStudentPersona();
      if ((res.code === 0 || res.code === 200) && res.data) {
        setPersona(res.data);
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setPersona(demoPersona);
    setLoading(false);
  };

  const data = persona || demoPersona;

  return (
    <div className="persona-page-v2">
      <div className="persona-header-v2">
        <div className="persona-header-content-v2">
          <div className="persona-back-btn-v2" onClick={() => navigate(-1)}>←</div>
          <span className="persona-header-title-v2">学习画像</span>
        </div>
      </div>

      <div className="persona-content-v2">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* 基本信息 */}
            <div className="persona-section-v2">
              <div className="persona-profile-v2">
                <div className="persona-avatar-v2">{data.name?.charAt(0) || '学'}</div>
                <div className="persona-info-v2">
                  <span className="persona-name-v2">{data.name}</span>
                  <span className="persona-meta-v2">{data.email}</span>
                  <span className="persona-meta-v2">{data.school}{data.major ? ` · ${data.major}` : ''}</span>
                </div>
              </div>
              <div className="persona-tags-v2">
                <span className="persona-tag-v2 style">学习风格: {data.learning_style}</span>
                {data.strengths?.map(s => (
                  <span key={s} className="persona-tag-v2 strength">{s}</span>
                ))}
                {data.weaknesses?.map(w => (
                  <span key={w} className="persona-tag-v2 weakness">{w}</span>
                ))}
              </div>
            </div>

            {/* 能力维度 */}
            <div className="persona-section-v2">
              <div className="persona-section-title-v2">能力维度</div>
              <div className="persona-radar-v2">
                {data.dimensions?.map(dim => (
                  <div key={dim.label} className="persona-radar-item-v2">
                    <span className="persona-radar-label-v2">{dim.label}</span>
                    <div className="persona-radar-bar-v2">
                      <div className="persona-radar-fill-v2" style={{ width: `${dim.value}%`, background: dim.color }} />
                    </div>
                    <span className="persona-radar-value-v2">{dim.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 知识点掌握热力图 */}
            {data.chapters && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">知识点掌握度</div>
                <div className="persona-heatmap-v2">
                  {data.chapters.map((ch, idx) => (
                    <div key={idx} className="persona-heatmap-row-v2">
                      <span className="persona-heatmap-label-v2">{ch.name}</span>
                      <div className="persona-heatmap-cells-v2">
                        {ch.scores.map((s, si) => (
                          <div key={si} className="persona-heatmap-cell-v2" style={{ background: heatColor(s) }} title={`${ch.kps?.[si] || ''}: ${s}`}>
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 学习行为 */}
            {data.behavior && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">学习行为分析</div>
                <div className="persona-behavior-v2">
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">学习高峰时段</span>
                    <span className="persona-behavior-value-v2">{data.behavior.peak_hours}</span>
                  </div>
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">平均单次学习时长</span>
                    <span className="persona-behavior-value-v2">{data.behavior.avg_session_min} 分钟</span>
                  </div>
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">答题速度</span>
                    <span className="persona-behavior-value-v2">{data.behavior.answer_speed}</span>
                  </div>
                  <div className="persona-behavior-item-v2">
                    <span className="persona-behavior-label-v2">复习回顾率</span>
                    <span className="persona-behavior-value-v2">{data.behavior.review_rate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 学习建议 */}
            {data.suggestion && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">学习建议</div>
                <div className="persona-suggestion-v2">💡 {data.suggestion}</div>
              </div>
            )}

            {/* 推荐学习路径 */}
            {data.learning_path && (
              <div className="persona-section-v2">
                <div className="persona-section-title-v2">推荐学习路径</div>
                <div className="persona-path-v2">
                  {data.learning_path.map((step, idx) => (
                    <div key={idx} className="persona-path-item-v2">
                      <span className="persona-path-num-v2">{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="persona-footer-v2">
              <button
                className="persona-footer-btn-v2"
                onClick={() => navigate('/student/big-kg?title=' + encodeURIComponent('课程知识图谱'))}
              >
                查看大图谱
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
