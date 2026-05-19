import AuthGuard from '../components/AuthGuard';
import StudentHome from '../pages/student/StudentHome';
import StudentLearn from '../pages/student/StudentLearn';
import StudentClassCourse from '../pages/student/StudentClassCourse';
import StudentVideoLearning from '../pages/student/StudentVideoLearning';
import StudentAIChat from '../pages/student/StudentAIChat';
import StudentKnowledgeGraph from '../pages/student/StudentKnowledgeGraph';
import StudentReport from '../pages/student/StudentReport';
import StudentPractice from '../pages/student/StudentPractice';
import StudentMe from '../pages/student/StudentMe';
import StudentSettings from '../pages/student/StudentSettings';

const studentRoutes = [
  { path: '/student/home', element: <StudentHome /> },
  { path: '/student/learn', element: <StudentLearn /> },
  { path: '/student/class/:classId', element: <StudentClassCourse /> },
  { path: '/student/video/:classId/:videoId', element: <StudentVideoLearning /> },
  { path: '/student/chat', element: <StudentAIChat /> },
  { path: '/student/graph', element: <StudentKnowledgeGraph /> },
  { path: '/student/report', element: <StudentReport /> },
  { path: '/student/practice', element: <StudentPractice /> },
  { path: '/student/me', element: <StudentMe /> },
  { path: '/student/settings', element: <StudentSettings /> },
];

const StudentRoutes = () =>
  studentRoutes.map(({ path, element }) => (
    <Route
      key={path}
      path={path}
      element={<AuthGuard allowedRole="student">{element}</AuthGuard>}
    />
  ));

export default StudentRoutes;
