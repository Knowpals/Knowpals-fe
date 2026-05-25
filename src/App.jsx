import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherRoutes from './routes/teacherRoutes';
import StudentRoutes from './routes/studentRoutes';
import './styles/globalStyles';

function App() {
  return (
    <Router>
      <Routes>
        {/* 公共路由 */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 教师端路由（调用以返回 <Route[]>） */}
        {TeacherRoutes()}

        {/* 学生端路由（调用以返回 <Route[]>） */}
        {StudentRoutes()}
      </Routes>
    </Router>
  );
}

export default App;
