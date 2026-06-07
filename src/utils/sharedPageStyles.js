// 所有独立页面（非 StudentLayout 包裹）共享的头部样式
import { injectStyles } from './injectStyles';

injectStyles('shared-page-header', `
  .sp-header {
    background: linear-gradient(160deg, #4c1d95 0%, #6d28d9 30%, #7c3aed 70%, #a78bfa 100%);
    padding: 16px 15px; color: #fff;
    position: relative; overflow: hidden;
  }
  .sp-header::after {
    content: ''; position: absolute; top: -20px; left: 0; right: 0; height: 80px;
    background: url('/顶部导航栏光晕.png') center top / cover no-repeat;
    opacity: 0.22; pointer-events: none; z-index: 0;
  }
  .sp-header-row {
    display: flex; align-items: center; gap: 12px;
    position: relative; z-index: 1;
  }
  .sp-header-title { font-size: 17px; font-weight: 500; letter-spacing: 0.3px; }
  .sp-header-subtitle { font-size: 12px; opacity: 0.75; font-weight: 400; }

  /* 页面容器 */
  .sp-page { min-height: 100vh; background: #f5f7fa; position: relative; }
  .sp-page::before {
    content: ''; position: fixed; inset: 0; z-index: 0;
    background: url('/页面全局背景纹理.png') repeat;
    background-size: 400px 400px;
    opacity: 0.05; pointer-events: none;
  }
  .sp-content { padding: 12px 15px; max-width: 480px; margin: 0 auto; position: relative; z-index: 1; }
  @media (min-width: 481px) { .sp-content { max-width: 1200px; padding: 16px 32px; } }

  /* 卡片通用 */
  .sp-card {
    background: #fff; border-radius: 14px; padding: 16px;
    margin-bottom: 12px; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .sp-card-title { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 12px; letter-spacing: 0.2px; }

  /* 底部操作栏 */
  .sp-footer { display: flex; gap: 12px; margin-top: 16px; }
  .sp-footer-btn {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 14px; font-weight: 500; cursor: pointer; border: none;
    letter-spacing: 0.3px; transition: all 0.2s ease;
  }
  .sp-footer-btn.primary {
    background: linear-gradient(145deg, #6d28d9, #8b5cf6); color: #fff;
    box-shadow: 0 2px 12px rgba(124,58,237,0.2);
  }
  .sp-footer-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(124,58,237,0.3); }
  .sp-footer-btn.secondary {
    background: transparent; color: #7c3aed; border: 1px solid rgba(124,58,237,0.2);
  }
  .sp-footer-btn.secondary:hover { background: #faf9ff; border-color: #7c3aed; }
`);
