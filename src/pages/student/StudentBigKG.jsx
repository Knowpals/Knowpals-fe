import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Card } from 'antd';
import KnowledgeGraphNetwork from '../../components/KnowledgeGraphNetwork';
import BackArrow from '../../components/BackArrow';
import AIFloatButton from '../../components/AIFloatButton';
import { getBigKG } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';
import '../../utils/sharedPageStyles';

injectStyles('student-big-kg', `
  .big-kg-page-v2 { min-height: 100vh; background: #f5f7fa; }
  .big-kg-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 16px 15px; color: #fff;
  }
  .big-kg-header-content-v2 { display: flex; align-items: center; gap: 12px; }
  .big-kg-title-section-v2 { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .big-kg-title-v2 { font-size: 18px; font-weight: 600; }
  .big-kg-subtitle-v2 { font-size: 12px; opacity: 0.85; }
  .big-kg-stats-v2 { display: flex; justify-content: space-around; padding: 8px 0 0; }
  .big-kg-stat-item-v2 { display: flex; flex-direction: column; align-items: center; }
  .big-kg-stat-value-v2 { font-size: 15px; font-weight: 700; }
  .big-kg-stat-label-v2 { font-size: 11px; opacity: 0.85; }
  .big-kg-content-v2 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .big-kg-content-v2 { max-width: 1200px; padding: 16px 32px; } }
  .big-kg-card-v2 { border-radius: 12px !important; overflow: hidden; }
  .big-kg-card-v2 .ant-card-body { padding: 0 !important; }
  .big-kg-footer-v2 { display: flex; gap: 12px; margin-top: 16px; }
  .big-kg-footer-btn-v2 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
  }
  .big-kg-footer-btn-v2.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .big-kg-footer-btn-v2.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
`);

export default function StudentBigKG() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState('');

  const classId = searchParams.get('classId');
  const pageTitle = searchParams.get('title') || '数值分析知识图谱';

  useEffect(() => { fetchGraph(); }, []);

  const fetchGraph = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/kg_data.json');
      if (res.ok) {
        setGraphData(await res.json());
        setLoading(false);
        return;
      }
    } catch (e) { /* fall through */ }
    try {
      const res = await getBigKG({ class_id: classId });
      if ((res.code === 0 || res.code === 200) && res.data) {
        setGraphData(res.data.tree ? res.data : { tree: res.data, edges: [] });
        setLoading(false);
        return;
      }
    } catch (e) { /* fall through */ }
    setError('加载知识图谱数据失败');
    setLoading(false);
  };

  const treeData = graphData?.tree;
  const totalNodes = graphData?.meta?.totalNodes || 0;
  const moduleCount = graphData?.meta?.moduleCount || 0;
  const edgeCount = graphData?.meta?.networkEdgeCount || (graphData?.edges?.length || 0);

  // 子节点点击暂不跳转（小图谱页面后续对接真实数据）

  return (
    <div className="big-kg-page-v2">
      <div className="big-kg-header-v2">
        <div className="big-kg-header-content-v2">
          <BackArrow onClick={() => navigate(-1)} />
          <div className="big-kg-title-section-v2">
            <span className="big-kg-title-v2">{decodeURIComponent(pageTitle)}</span>
            <span className="big-kg-subtitle-v2">AI 审计版 · 网状知识图谱</span>
          </div>
        </div>
        <div className="big-kg-stats-v2">
          <div className="big-kg-stat-item-v2">
            <span className="big-kg-stat-value-v2">{totalNodes}</span>
            <span className="big-kg-stat-label-v2">总节点</span>
          </div>
          <div className="big-kg-stat-item-v2">
            <span className="big-kg-stat-value-v2" style={{ color: '#a78bfa' }}>{moduleCount}</span>
            <span className="big-kg-stat-label-v2">模块</span>
          </div>
          <div className="big-kg-stat-item-v2">
            <span className="big-kg-stat-value-v2" style={{ color: '#f59e0b' }}>{edgeCount}</span>
            <span className="big-kg-stat-label-v2">关系边</span>
          </div>
        </div>
      </div>

      <div className="big-kg-content-v2">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <div style={{ color: '#9ca3af', marginTop: 12 }}>正在加载知识图谱...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</div>
            <button className="big-kg-footer-btn-v2 primary" style={{ width: 120 }} onClick={fetchGraph}>重试</button>
          </div>
        ) : (
          <Card className="big-kg-card-v2">
            <KnowledgeGraphNetwork
              tree={treeData}
              edges={graphData?.edges || []}
            />
          </Card>
        )}

        <div className="big-kg-footer-v2">
          <button className="big-kg-footer-btn-v2 primary" onClick={() => navigate(`/student/deep-practice?classId=${classId || ''}&title=${encodeURIComponent(pageTitle)}`)}>
            深度练习
          </button>
          <button className="big-kg-footer-btn-v2 secondary" onClick={() => navigate(-1)}>
            返回课程
          </button>
        </div>
      </div>

      <AIFloatButton />
    </div>
  );
}
