import { injectStyles } from '../utils/injectStyles';

injectStyles('global-base', `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0; padding: 0;
  }
  .gradient-btn {
    background: linear-gradient(135deg, #fb923c 0%, #7c3aed 100%) !important;
    border: none !important; color: white !important;
    font-weight: 500; height: 44px; border-radius: 8px;
  }
  .gradient-btn:hover { opacity: 0.9; box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.45); z-index: 999;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .modal-sheet {
    width: 100%; max-width: 480px; background: #fff;
    border-radius: 16px 16px 0 0; padding: 24px 20px 32px;
    animation: slideUp 0.3s ease;
  }
  .modal-sheet-title { font-size: 18px; font-weight: 600; text-align: center; margin-bottom: 20px; color: #1f2937; }
  .modal-input {
    width: 100%; height: 48px; border: 1px solid #e5e7eb; border-radius: 10px;
    padding: 0 16px; font-size: 16px; outline: none; transition: border-color 0.2s;
  }
  .modal-input:focus { border-color: #7c3aed; }
  .modal-sheet-btns { display: flex; gap: 12px; margin-top: 20px; }
  .modal-btn { flex: 1; height: 44px; border-radius: 10px; border: none; font-size: 16px; cursor: pointer; transition: opacity 0.2s; }
  .modal-btn.cancel { background: #f3f4f6; color: #6b7280; }
  .modal-btn.confirm { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff; }
  .modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`);
