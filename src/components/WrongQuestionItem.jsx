import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { QUESTION_TYPE_META, normalizeQuestionType } from '../constants/questionTypes';
import { injectStyles } from '../utils/injectStyles';

injectStyles('wrong-question-item', `
  .wq-viz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  @media (max-width: 640px) { .wq-viz-grid { grid-template-columns: 1fr; } }
  .wq-viz-card {
    background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
    padding: 10px; overflow: hidden;
  }
  .wq-viz-card.full { grid-column: 1 / -1; }
  .wq-viz-card-title {
    font-size: 11px; font-weight: 600; color: #555; margin-bottom: 8px;
    display: flex; align-items: center; gap: 4px;
  }
  .wq-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .wq-time-compare { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
  .wq-time-bar-wrap { flex: 1; position: relative; height: 28px; background: #f5f5f5; border-radius: 4px; }
  .wq-time-class-range {
    position: absolute; top: 3px; bottom: 3px; background: #e0e7ff; border-radius: 3px;
    border-left: 1px dashed #818cf8; border-right: 1px dashed #818cf8;
    display: flex; align-items: center; justify-content: center; font-size: 9px; color: #6366f1;
  }
  .wq-time-student-marker {
    position: absolute; top: -2px; bottom: -2px; width: 3px;
    background: #ef4444; border-radius: 2px; z-index: 2;
  }
  .wq-time-student-marker::after {
    content: ''; position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
    width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
    border-bottom: 6px solid #ef4444;
  }
  .wq-time-legend { display: flex; gap: 12px; font-size: 10px; color: #888; margin-top: 4px; }
  .wq-error-tag {
    display: inline-block; padding: 3px 8px; margin: 2px 4px 2px 0;
    border-radius: 10px; font-size: 10px; font-weight: 500;
  }
  .wq-step-row {
    display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5;
    font-size: 11px; align-items: flex-start;
  }
  .wq-step-num {
    width: 22px; height: 22px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 10px; font-weight: 700;
    flex-shrink: 0; color: #fff;
  }
  .wq-step-num.ok { background: #10b981; }
  .wq-step-num.err { background: #ef4444; }
  .wq-step-num.skp { background: #d1d5db; }
  .wq-step-compare { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .wq-step-std { color: #10b981; font-size: 10px; }
  .wq-step-stu { color: #ef4444; font-size: 10px; }

  .wq-conclusion {
    background: linear-gradient(135deg, #fef2f2, #fff7ed, #fefce8);
    border: 1px solid #fecaca; border-radius: 10px; padding: 14px;
  }
  .wq-conclusion-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
  }
  .wq-conclusion-tag {
    padding: 4px 14px; border-radius: 16px; font-size: 13px; font-weight: 700; color: #fff;
  }
  .wq-conclusion-confidence { font-size: 12px; color: #6b7280; }
  .wq-conclusion-bar {
    width: 100%; height: 6px; background: #e5e5e5; border-radius: 3px;
    margin: 6px 0 10px; overflow: hidden;
  }
  .wq-conclusion-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .wq-conclusion-summary { font-size: 12px; color: #555; line-height: 1.5; margin-bottom: 8px; }
  .wq-conclusion-advice {
    font-size: 12px; color: #7c3aed; line-height: 1.5;
    padding: 8px 10px; background: #f0f4ff; border-radius: 6px;
    border-left: 3px solid #7c3aed;
  }
`);

export default function WrongQuestionItem({ question, index }) {
  const [open, setOpen] = useState(false);
  const levelColors = {
    '基础薄弱': '#ef4444', '能力天花板': '#f97316', '粗心失误': '#f59e0b', '正常过渡': '#6b7280',
  };
  const lc = levelColors[question.primaryLevel] || '#6b7280';
  const qType = normalizeQuestionType(question.type);
  const qMeta = QUESTION_TYPE_META[qType];
  const v = question.viz;

  const formatAnsDisplay = (ans) => {
    if (Array.isArray(ans)) return ans.join(', ');
    return String(ans ?? '');
  };

  // --- ECharts 配置 ---
  const diffGradientOption = v?.difficulty_gradient ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['学生正确率', '班级平均'], bottom: 0, textStyle: { fontSize: 10 } },
    grid: { top: 8, left: 8, right: 8, bottom: 32, containLabel: true },
    xAxis: { type: 'category', data: v.difficulty_gradient.categories, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', max: 100, axisLabel: { fontSize: 9, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [
      { name: '学生正确率', type: 'bar', data: v.difficulty_gradient.student_rates.map(r => Math.round(r * 100)),
        itemStyle: { color: (p) => p.dataIndex >= v.difficulty_gradient.cliff_at ? '#ef4444' : '#7c3aed', borderRadius: [4,4,0,0] },
        barWidth: 16, label: { show: true, position: 'top', fontSize: 9, fontWeight: 600, color: (p) => p.dataIndex >= v.difficulty_gradient.cliff_at ? '#ef4444' : '#7c3aed' } },
      { name: '班级平均', type: 'bar', data: v.difficulty_gradient.class_avg_rates.map(r => Math.round(r * 100)),
        itemStyle: { color: '#d1d5db', borderRadius: [4,4,0,0] }, barWidth: 16, barGap: '30%',
        label: { show: true, position: 'top', fontSize: 9, color: '#9ca3af' } },
    ],
    color: ['#7c3aed', '#d1d5db'],
  } : null;

  const trendOption = v?.history_trend ? {
    tooltip: { trigger: 'axis' },
    grid: { top: 8, left: 8, right: 8, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: v.history_trend.dates, axisLabel: { fontSize: 9 }, boundaryGap: false },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 9, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [{
      type: 'line', data: v.history_trend.rates, smooth: true,
      lineStyle: { color: '#7c3aed', width: 2 },
      itemStyle: { color: '#7c3aed' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(124,58,237,0.2)' }, { offset: 1, color: 'rgba(124,58,237,0.02)' }] } },
      markLine: { silent: true, data: [{ yAxis: 60, lineStyle: { color: '#f59e0b', type: 'dashed' }, label: { formatter: '警戒线', fontSize: 9 } }] },
    }],
  } : null;

  const radarOption = v?.prerequisite_gap ? {
    radar: {
      center: ['50%', '55%'],
      radius: '65%',
      indicator: v.prerequisite_gap.dimensions.map(d => ({ name: d.name, max: 1.0 })),
      axisName: { fontSize: 9, color: '#666' },
    },
    series: [
      { type: 'radar', name: '掌握度',
        data: [{ value: v.prerequisite_gap.dimensions.map(d => d.mastery), name: '当前', areaStyle: { color: 'rgba(124,58,237,0.15)' }, lineStyle: { color: '#7c3aed' }, itemStyle: { color: '#7c3aed' } }],
        symbol: 'circle', symbolSize: 4,
      },
      { type: 'radar', name: '阈值',
        data: [{ value: v.prerequisite_gap.dimensions.map(d => d.threshold), name: '阈值', areaStyle: { opacity: 0 }, lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 }, itemStyle: { color: '#ef4444' } }],
        symbol: 'none',
      },
    ],
    color: ['#7c3aed', '#ef4444'],
  } : null;

  return (
    <div style={{ marginBottom: 10, border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
      {/* 折叠头部 */}
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: open ? '#f8f5ff' : '#fff', cursor: 'pointer', transition: 'background 0.15s' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: qMeta?.bg || '#f5f5f5', color: qMeta?.color || '#666', flexShrink: 0 }}>{qMeta?.shortLabel || '题'}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#9ca3af', marginRight: 4 }}>#{index + 1}</span>{question.title}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 11 }}>
            {question.difficulty != null && <span style={{ color: '#999' }}>难度 {question.difficulty}</span>}
            {question.studentAnswer != null && <span style={{ color: '#ef4444' }}>答：{formatAnsDisplay(question.studentAnswer)}</span>}
            {question.correctAnswer != null && <span style={{ color: '#10b981' }}>正解：{formatAnsDisplay(question.correctAnswer)}</span>}
            {question.error_rate != null && <span style={{ color: '#ef4444', fontWeight: 600 }}>错误率 {(question.error_rate * 100).toFixed(0)}%</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
          {question.primaryLevel && (
            <span style={{ padding: '3px 10px', borderRadius: 12, background: lc + '18', color: lc, fontSize: 11, fontWeight: 600 }}>{question.primaryLevel}{question.primaryError ? ` · ${question.primaryError}` : ''}</span>
          )}
          <span style={{ fontSize: 14, color: '#9ca3af', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : '' }}>▼</span>
        </div>
      </div>

      {/* 展开内容 */}
      {open && (
        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid #f0f0f0', background: '#fafbfc' }}>
          {/* 选择题选项展示 */}
          {question.options && question.options.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>选项详情：</div>
              {question.options.map((opt, oi) => {
                const letter = opt.letter || String.fromCharCode(65 + oi);
                const isCorrect = Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(letter) : letter === question.correctAnswer;
                const isStudent = Array.isArray(question.studentAnswer) ? question.studentAnswer.includes(letter) : letter === question.studentAnswer;
                return (
                  <span key={oi} style={{ display: 'inline-block', padding: '2px 8px', margin: '0 4px 4px 0', borderRadius: 4, fontSize: 11,
                    background: isCorrect ? '#dcfce7' : isStudent ? '#fee2e2' : '#f5f5f5',
                    color: isCorrect ? '#16a34a' : isStudent ? '#dc2626' : '#666',
                    border: `1px solid ${isCorrect ? '#bbf7d0' : isStudent ? '#fecaca' : '#e5e5e5'}`,
                  }}>{letter}. {opt.text}</span>
                );
              })}
            </div>
          )}

          {/* ====== 六维可视化 ====== */}
          <div className="wq-viz-grid">

            {/* ① 难度梯度条形图 */}
            {v?.difficulty_gradient && (
              <div className="wq-viz-card">
                <div className="wq-viz-card-title"><span className="wq-dot" style={{ background: '#7c3aed' }} />① 难度梯度</div>
                <ReactECharts option={diffGradientOption} style={{ height: 140 }} notMerge />
                {v.difficulty_gradient.cliff_at >= 0 && (
                  <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2, fontWeight: 500 }}>
                    ⚠ 从「{v.difficulty_gradient.categories[v.difficulty_gradient.cliff_at]}」难度开始断崖下降
                  </div>
                )}
              </div>
            )}

            {/* ② 答题时间对比 */}
            {v?.time_comparison && (
              <div className="wq-viz-card">
                <div className="wq-viz-card-title"><span className="wq-dot" style={{ background: '#f59e0b' }} />② 答题时间对比</div>
                <div className="wq-time-compare">
                  <span style={{ fontSize: 10, color: '#888', whiteSpace: 'nowrap' }}>学生</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: (() => { const d = v.time_comparison.deviation; return d === 'fast' ? '#f59e0b' : d === 'slow' ? '#ef4444' : '#10b981'; })() }}>{v.time_comparison.student_time}s</span>
                  <span style={{ fontSize: 10, color: '#888', whiteSpace: 'nowrap' }}>中位</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#6b7280' }}>{v.time_comparison.class_median}s</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: (() => { const d = v.time_comparison.deviation; return d === 'fast' ? '#f59e0b' : d === 'slow' ? '#ef4444' : '#10b981'; })() }}>
                    {v.time_comparison.deviation === 'fast' ? '←' : v.time_comparison.deviation === 'slow' ? '→' : '≈'}
                  </span>
                </div>
                <div className="wq-time-bar-wrap">
                  <div className="wq-time-class-range" style={{ left: `${(v.time_comparison.class_p25 / Math.max(v.time_comparison.class_p75 * 1.3, v.time_comparison.student_time * 1.1)) * 100}%`, right: `${100 - (v.time_comparison.class_p75 / Math.max(v.time_comparison.class_p75 * 1.3, v.time_comparison.student_time * 1.1)) * 100}%` }}>班级 25%-75%</div>
                  <div className="wq-time-student-marker" style={{ left: `${(v.time_comparison.student_time / Math.max(v.time_comparison.class_p75 * 1.3, v.time_comparison.student_time * 1.1)) * 100}%` }} />
                </div>
                <div className="wq-time-legend">
                  <span>⬤ 班级区间 P25–P75</span>
                  <span style={{ color: '#ef4444' }}>▲ 学生用时</span>
                  <span style={{ fontWeight: 600, color: (() => { const d = v.time_comparison.deviation; return d === 'fast' ? '#f59e0b' : d === 'slow' ? '#ef4444' : '#10b981'; })() }}>
                    {v.time_comparison.deviation === 'fast' ? '⚡ 过快 → 仓促' : v.time_comparison.deviation === 'slow' ? '🐢 过慢 → 纠结' : '✅ 正常'}
                  </span>
                </div>
              </div>
            )}

            {/* ③ 错误选项分析 */}
            {v?.error_option_analysis && (
              <div className="wq-viz-card">
                <div className="wq-viz-card-title"><span className="wq-dot" style={{ background: '#ef4444' }} />③ 错误选项分析</div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 8, lineHeight: 1.4 }}>{v.error_option_analysis.student_label}</div>
                {v.error_option_analysis.error_tags.map((et, ti) => (
                  <span key={ti} className="wq-error-tag" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    {et.tag} <b>({Math.round(et.freq * 100)}%)</b>
                  </span>
                ))}
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>百分比 = 该标签在历史错误中的出现频率</div>
              </div>
            )}

            {/* ④ 解题步骤定位 */}
            {v?.solution_steps && (
              <div className="wq-viz-card">
                <div className="wq-viz-card-title"><span className="wq-dot" style={{ background: '#8b5cf6' }} />④ 解题步骤定位</div>
                {v.solution_steps.map((st, si) => (
                  <div key={si} className="wq-step-row">
                    <div className={`wq-step-num ${st.ok === true ? 'ok' : st.ok === false ? 'err' : 'skp'}`}>{st.step}</div>
                    <div className="wq-step-compare">
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>{st.desc}</div>
                      <div className="wq-step-std">✓ 标准：{st.standard}</div>
                      {st.ok === false && <div className="wq-step-stu">✗ 学生：{st.student}</div>}
                      {st.ok === true && <div style={{ color: '#10b981', fontSize: 10 }}>✓ 学生：{st.student}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ⑤ 历史趋势折线图 */}
            {v?.history_trend && (
              <div className="wq-viz-card">
                <div className="wq-viz-card-title"><span className="wq-dot" style={{ background: '#10b981' }} />⑤ 历史趋势 — {v.history_trend.knowledge_point}</div>
                <ReactECharts option={trendOption} style={{ height: 140 }} notMerge />
              </div>
            )}

            {/* ⑥ 前置知识缺口雷达图 */}
            {v?.prerequisite_gap && (
              <div className="wq-viz-card">
                <div className="wq-viz-card-title"><span className="wq-dot" style={{ background: '#f97316' }} />⑥ 前置知识掌握缺口</div>
                <ReactECharts option={radarOption} style={{ height: 180 }} notMerge />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 10, color: '#888' }}>
                  <span><span style={{ color: '#7c3aed', fontWeight: 600 }}>━━</span> 当前掌握度</span>
                  <span><span style={{ color: '#ef4444', fontWeight: 600 }}>---</span> 达标阈值 (0.7)</span>
                </div>
              </div>
            )}
          </div>

          {/* ====== 综合结论面板 ====== */}
          {v?.conclusion && (
            <div className="wq-conclusion">
              <div className="wq-conclusion-header">
                <span className="wq-conclusion-tag" style={{ background: lc }}>
                  {v.conclusion.primary_category}
                </span>
                <span className="wq-conclusion-confidence">
                  置信度 <b style={{ fontSize: 16, color: lc }}>{Math.round(v.conclusion.confidence * 100)}%</b>
                  {v.conclusion.confidence > 0.6 ? ' · 可信度高' : v.conclusion.confidence > 0.3 ? ' · 可信度中等' : ' · 待更多数据验证'}
                </span>
              </div>
              <div className="wq-conclusion-bar">
                <div className="wq-conclusion-bar-fill" style={{ width: `${Math.round(v.conclusion.confidence * 100)}%`, background: lc }} />
              </div>
              <div className="wq-conclusion-summary">
                <b>📋 证据摘要：</b>{v.conclusion.evidence_summary}
              </div>
              <div className="wq-conclusion-advice">
                <b>💡 学习建议：</b>{v.conclusion.learning_advice}
              </div>
            </div>
          )}

          {/* 降级：无 viz 时显示原始证据条 */}
          {!v && question.evidence && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>证据维度分析</span>
              </div>
              {question.evidence.map((ev, ei) => (
                <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 58, fontSize: 11, color: '#6b7280', textAlign: 'right', flexShrink: 0 }}>{ev.name}</span>
                  <div style={{ flex: 1, height: 5, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${ev.score * 100}%`, height: '100%', borderRadius: 3, background: ev.score > 0.6 ? '#10b981' : ev.score > 0.4 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span style={{ width: 32, fontSize: 11, fontWeight: 600, color: '#333' }}>{Math.round(ev.score * 100)}%</span>
                </div>
              ))}
            </>
          )}

          {/* 降级：完全无 viz 也无 evidence 时，显示错误率 */}
          {!v && !question.evidence && question.error_rate != null && (
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>班级错误率</span>
                <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${question.error_rate * 100}%`, height: '100%', borderRadius: 4, background: question.error_rate > 0.35 ? '#ef4444' : '#f59e0b' }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: question.error_rate > 0.35 ? '#ef4444' : '#f59e0b' }}>{(question.error_rate * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
