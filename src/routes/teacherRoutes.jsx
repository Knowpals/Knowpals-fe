import { Route } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard';
import Home from '../pages/teacher/Home';
import VideoDetail from '../pages/teacher/VideoDetail';
import PendingReview from '../pages/teacher/PendingReview';
import MyProfile from '../pages/teacher/MyProfile';
import DataAnalysis from '../pages/teacher/DataAnalysis';
import AnalysisVideoDetail from '../pages/teacher/AnalysisVideoDetail';
import ClassManagement from '../pages/teacher/ClassManagement';
import ClassDetail from '../pages/teacher/ClassDetail';
import VideoManagement from '../pages/teacher/VideoManagement';
import VideoDetailEdit from '../pages/teacher/VideoDetailEdit';
import ClassVideoDetail from '../pages/teacher/ClassVideoDetail';
import StudentData from '../pages/teacher/StudentData';

const teacherRoutes = [
  { path: '/home', element: <Home /> },
  { path: '/video-detail', element: <VideoDetail /> },
  { path: '/pending-review', element: <PendingReview /> },
  { path: '/my', element: <MyProfile /> },
  { path: '/data-analysis', element: <DataAnalysis /> },
  { path: '/analysis-video', element: <AnalysisVideoDetail /> },
  { path: '/class-management', element: <ClassManagement /> },
  { path: '/class-detail/:classId', element: <ClassDetail /> },
  { path: '/class-video-detail/:classId/:videoId', element: <ClassVideoDetail /> },
  { path: '/student-data/:studentId', element: <StudentData /> },
  { path: '/video-management', element: <VideoManagement /> },
  { path: '/video-detail-edit/:videoId', element: <VideoDetailEdit /> },
];

const TeacherRoutes = () =>
  teacherRoutes.map(({ path, element }) => (
    <Route
      key={path}
      path={path}
      element={<AuthGuard allowedRole="teacher">{element}</AuthGuard>}
    />
  ));

export default TeacherRoutes;
