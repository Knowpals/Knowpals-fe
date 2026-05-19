import { useState } from 'react';
import { Card, Button, Switch, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';

const StudentSettings = () => {
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <StudentLayout title="设置">
      <div style={{ padding: '0' }}>
        <Card className="me-menu" styles={{ body: { padding: 0 } }}>
          <div className="me-menu-item">
            <span>消息推送通知</span>
            <Switch checked={pushEnabled} onChange={setPushEnabled} />
          </div>
          <div className="me-menu-item">
            <span>答题音效</span>
            <Switch checked={soundEnabled} onChange={setSoundEnabled} />
          </div>
        </Card>

        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <Button block onClick={() => navigate('/student/report')} style={{ marginBottom: 8 }}>
            查看学习报告
          </Button>
          <Button block onClick={() => message.info('已是最新版本')}>
            检查更新
          </Button>
        </div>

        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 24 }}>
          知伴AI V2.0 · C++ 智能学习平台
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentSettings;
