import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import { Loading } from './components/ui/loading';
import AnalystGuard from './components/guards/AnalystGuard';
import ClubGuard from './components/guards/ClubGuard';
import CoachGuard from './components/guards/CoachGuard';
import ScoutGuard from './components/guards/ScoutGuard';
import AdminGuard from './components/guards/AdminGuard';
import AuthGuard from './components/guards/AuthGuard';

// 核心页面 - 立即加载
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';

// 按需加载的页面
const ScoutMap = lazy(() => import('./pages/ScoutMap'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const RegisterSuccess = lazy(() => import('./pages/auth/RegisterSuccess'));
const RegisterPending = lazy(() => import('./pages/auth/RegisterPending'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VideoAnalysisLanding = lazy(() => import('./pages/VideoAnalysisLanding'));
const AnalystSelect = lazy(() => import('./pages/AnalystSelect'));
const PackageSelect = lazy(() => import('./pages/PackageSelect'));
const OrderConfirm = lazy(() => import('./pages/OrderConfirm'));
const OrderPayment = lazy(() => import('./pages/OrderPayment'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const PostPaymentUpload = lazy(() => import('./pages/PostPaymentUpload'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const ReportList = lazy(() => import('./pages/ReportList'));
const ReportView = lazy(() => import('./pages/ReportView'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AnalystDashboard = lazy(() => import('./pages/AnalystDashboard/index'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOverview = lazy(() => import('./pages/AdminDashboard/Overview'));
const AdminOrders = lazy(() => import('./pages/AdminDashboard/Orders'));
const AdminUsers = lazy(() => import('./pages/AdminDashboard/Users'));
const AdminApplications = lazy(() => import('./pages/AdminDashboard/Applications'));
const AdminReportsReview = lazy(() => import('./pages/AdminDashboard/ReportsReview'));
const AdminSettings = lazy(() => import('./pages/AdminDashboard/Settings'));
const OrderDispatchCenter = lazy(() => import('./pages/AdminDashboard/OrderDispatchCenter'));
const AssignmentRecords = lazy(() => import('./pages/AdminDashboard/AssignmentRecords'));
const OperationsInsight = lazy(() => import('./pages/AdminDashboard/OperationsInsight'));
const ContentReports = lazy(() => import('./pages/AdminDashboard/ContentReports'));
const SensitiveWords = lazy(() => import('./pages/AdminDashboard/SensitiveWords'));
const Settlements = lazy(() => import('./pages/AdminDashboard/Settlements'));
const RevenueReport = lazy(() => import('./pages/AdminDashboard/RevenueReport'));
const AuditLogs = lazy(() => import('./pages/AdminDashboard/AuditLogs'));
const PlatformAnnouncements = lazy(() => import('./pages/AdminDashboard/PlatformAnnouncements'));
const Banners = lazy(() => import('./pages/AdminDashboard/Banners'));
const FAQs = lazy(() => import('./pages/AdminDashboard/FAQs'));
const LoginLogs = lazy(() => import('./pages/AdminDashboard/LoginLogs'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const OrderManagement = lazy(() => import('./pages/OrderManagement'));
const AnalystManagement = lazy(() => import('./pages/AnalystManagement'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const BecomeAnalyst = lazy(() => import('./pages/BecomeAnalyst'));
const ClubLanding = lazy(() => import('./pages/ClubLanding'));
const AnalystRegister = lazy(() => import('./pages/AnalystRegister'));
const AnalystApplySuccess = lazy(() => import('./pages/AnalystApplySuccess'));
const AnalystHomePage = lazy(() => import('./pages/AnalystHomePage'));
const CoachHomePage = lazy(() => import('./pages/CoachHomePage'));
const ScoutHomePage = lazy(() => import('./pages/ScoutHomePage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PersonalHomepage = lazy(() => import('./pages/PersonalHomepage'));
const PlayerSharePage = lazy(() => import('./pages/PlayerSharePage'));
const PlayerProfile = lazy(() => import('./pages/UserDashboard/PlayerProfile'));
const ClubDashboard = lazy(() => import('./pages/ClubDashboard'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const ScoutDashboard = lazy(() => import('./pages/ScoutDashboard'));
const CoachProfile = lazy(() => import('./pages/CoachDashboard/CoachProfile'));
const ScoutProfile = lazy(() => import('./pages/ScoutDashboard/ScoutProfile'));
const AnalystProfile = lazy(() => import('./pages/AnalystProfile'));
const ClubProfile = lazy(() => import('./pages/ClubProfile'));
const ClubHomePage = lazy(() => import('./pages/ClubDashboard/ClubHomePage'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const EditProfileEnhanced = lazy(() => import('./pages/EditProfileEnhanced'));
const Settings = lazy(() => import('./pages/Settings'));
const GrowthRecords = lazy(() => import('./pages/GrowthRecords'));
const PhysicalTests = lazy(() => import('./pages/ClubDashboard/PhysicalTests'));
const CreatePhysicalTest = lazy(() => import('./pages/ClubDashboard/CreatePhysicalTest'));
const PhysicalTestRecord = lazy(() => import('./pages/ClubDashboard/PhysicalTestRecord'));
const PlayerDetail = lazy(() => import('./pages/ClubDashboard/PlayerDetail'));
const BatchOrder = lazy(() => import('./pages/ClubDashboard/BatchOrder'));
const Analytics = lazy(() => import('./pages/ClubDashboard/Analytics'));
const ClubOrderManagement = lazy(() => import('./pages/ClubDashboard/OrderManagement'));
const PhysicalTestReport = lazy(() => import('./pages/ClubDashboard/PhysicalTestReport'));
const TacticEditPage = lazy(() => import('./pages/TacticEditPage'));
const MatchSelfReviewPage = lazy(() => import('./pages/UserDashboard/components/MatchSelfReviewPage'));
const FollowListPage = lazy(() => import('./pages/FollowListPage'));
// import PersonalHomepage from './pages/PersonalHomepage/index';

// 加载状态组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loading text="页面加载中..." />
  </div>
);

// 俱乐部公开主页包装组件
import { useParams } from 'react-router-dom';
const ClubPublicPage = () => {
  const { id } = useParams<{ id: string }>();
  return <ClubHomePage clubId={Number(id) || 0} />;
};

// 隐藏 Navbar 的路径列表（精确匹配或前缀匹配 + '/'）
const hideNavbarPaths = [
  '/user-dashboard',
  '/analyst/dashboard',
  '/analyst/profile/edit',
  '/admin/dashboard',
  '/admin/users',
  '/admin/orders',
  '/admin/analysts',
  '/club/dashboard',
  '/club/profile',
  '/club/physical-tests',
  '/club/players',
  '/club/orders',
  '/club/analytics',
  '/club/reports',
  '/club/physical-reports',
  '/coach/dashboard',
  '/scout/dashboard',
  '/scout/profile/edit',
  '/share/player',
  '/tactic-edit',
  '/match-self-review',
  '/settings',
];

function App() {
  const location = useLocation();
  const shouldShowNavbar = !hideNavbarPaths.some(path => {
    // 精确匹配或作为目录前缀匹配（确保后面跟 /）
    return location.pathname === path || location.pathname.startsWith(path + '/');
  });

  return (
    <div className="min-h-screen bg-primary">
      <Toaster richColors position="top-right" />
      {shouldShowNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scout-map" element={<ScoutMap />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/success" element={<RegisterSuccess />} />
          <Route path="/register/pending" element={<RegisterPending />} />
          <Route path="/video-analysis" element={<VideoAnalysisLanding />} />
          <Route path="/video-analysis/order" element={<Navigate to="/package-select" replace />} />
          {/* 分析师工作流统一在 /analyst/dashboard 内通过 VideoAnalysisWorkspace 完成 */}
          <Route path="/analyst/reports/new" element={<AnalystGuard><Navigate to="/analyst/dashboard" replace /></AnalystGuard>} />
          <Route path="/analyst/reports/:id/edit" element={<AnalystGuard><Navigate to="/analyst/dashboard" replace /></AnalystGuard>} />
          <Route path="/analyst-select" element={<AnalystSelect />} />
          <Route path="/package-select" element={<PackageSelect />} />
          <Route path="/order-confirm" element={<OrderConfirm />} />
          <Route path="/order/:id/payment" element={<OrderPayment />} />
          <Route path="/order/:id/success" element={<OrderSuccess />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/order/:orderId/upload" element={<PostPaymentUpload />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/reports" element={<AuthGuard><ReportList /></AuthGuard>} />
          <Route path="/reports/:id" element={<AuthGuard><ReportView /></AuthGuard>} />
          <Route path="/user-dashboard/*" element={<AuthGuard><UserDashboard /></AuthGuard>} />
          <Route path="/analyst/:id" element={<AnalystHomePage />} />
          <Route path="/analyst/dashboard" element={<AnalystGuard><AnalystDashboard /></AnalystGuard>} />
          <Route path="/analyst/profile/edit" element={<AnalystGuard><Navigate to="/settings" /></AnalystGuard>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>}>
            <Route index element={<AdminOverview />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="operations" element={<OperationsInsight />} />
            <Route path="orders/dispatch" element={<OrderDispatchCenter />} />
            <Route path="orders/assignments" element={<AssignmentRecords />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="revenue" element={<RevenueReport />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="reports" element={<AdminReportsReview />} />
            <Route path="content-reports" element={<ContentReports />} />
            <Route path="sensitive-words" element={<SensitiveWords />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="login-logs" element={<LoginLogs />} />
            <Route path="announcements" element={<PlatformAnnouncements />} />
            <Route path="banners" element={<Banners />} />
            <Route path="faqs" element={<FAQs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/admin/analysts" element={<AdminGuard><AnalystManagement /></AdminGuard>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/become-analyst" element={<BecomeAnalyst />} />
          <Route path="/club-landing" element={<ClubLanding />} />
          <Route path="/analyst/register" element={<AnalystRegister />} />
          <Route path="/analyst/apply-success" element={<AnalystApplySuccess />} />
          <Route path="/personal-homepage/:id?" element={<PersonalHomepage />} />
          <Route path="/followers/:userId" element={<FollowListPage />} />
          <Route path="/following/:userId" element={<FollowListPage />} />
          <Route path="/player/profile" element={<AuthGuard><PlayerProfile /></AuthGuard>} />
          <Route path="/share/player/:id" element={<PlayerSharePage />} />
          <Route path="/club/dashboard" element={<ClubGuard><ClubDashboard /></ClubGuard>} />
          <Route path="/club/physical-tests" element={<ClubGuard><PhysicalTests /></ClubGuard>} />
          <Route path="/club/physical-tests/create" element={<ClubGuard><CreatePhysicalTest /></ClubGuard>} />
          <Route path="/club/physical-tests/:id/record" element={<ClubGuard><PhysicalTestRecord /></ClubGuard>} />
          <Route path="/club/players/:id" element={<ClubGuard><PlayerDetail /></ClubGuard>} />
          <Route path="/club/orders/batch" element={<ClubGuard><BatchOrder /></ClubGuard>} />
          <Route path="/club/analytics" element={<ClubGuard><Analytics /></ClubGuard>} />
          <Route path="/club/orders" element={<ClubGuard><ClubOrderManagement /></ClubGuard>} />
          <Route path="/club/reports/:id" element={<ClubGuard><PhysicalTestReport /></ClubGuard>} />
          <Route path="/club/physical-reports/:id" element={<ClubGuard><PhysicalTestReport /></ClubGuard>} />
          <Route path="/tactic-edit" element={<TacticEditPage />} />
          <Route path="/match-self-review" element={<MatchSelfReviewPage />} />
          <Route path="/coach/dashboard" element={<CoachGuard><CoachDashboard /></CoachGuard>} />
          <Route path="/coach/:id/edit" element={<CoachGuard><Navigate to="/settings" /></CoachGuard>} />
          <Route path="/coach/:id" element={<CoachHomePage />} />
          <Route path="/clubs/:id" element={<ClubPublicPage />} />
          <Route path="/scout/dashboard" element={<ScoutGuard><ScoutDashboard /></ScoutGuard>} />
          <Route path="/scout/profile/edit" element={<ScoutGuard><Navigate to="/settings" /></ScoutGuard>} />
          <Route path="/scout/:id" element={<ScoutHomePage />} />
          <Route path="/edit-profile" element={<AuthGuard><EditProfile /></AuthGuard>} />
          <Route path="/edit-profile-enhanced" element={<AuthGuard><EditProfileEnhanced /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/growth-records" element={<AuthGuard><GrowthRecords /></AuthGuard>} />

          {/* 球探个人资料 */}
          <Route path="/scout/profile" element={<ScoutGuard><ScoutProfile /></ScoutGuard>} />
          {/* 教练个人资料 */}
          <Route path="/coach/profile" element={<CoachGuard><CoachProfile /></CoachGuard>} />
          {/* 分析师个人资料 */}
          <Route path="/analyst/profile" element={<AnalystGuard><AnalystProfile /></AnalystGuard>} />
          {/* 俱乐部个人资料 */}
          <Route path="/club/profile" element={<ClubGuard><ClubProfile /></ClubGuard>} />
          <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
          <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
