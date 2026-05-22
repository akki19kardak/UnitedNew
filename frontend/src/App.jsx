import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import useAuth from "./contexts/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute     from "./components/admin/AdminRoute";
import Layout         from "./components/Layout";
import AdminLayout    from "./components/admin/AdminLayout";

// Dashboard Router - redirects to appropriate dashboard based on role
const DashboardRouter = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Redirect based on role
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  
  // Non-admin users go to user dashboard
  return <Navigate to="/user/dashboard" replace />;
};

// Pages
import LandingPage         from "./pages/LandingPage";
import LoginPage           from "./pages/LoginPage";
import SignupPage          from "./pages/SignUp";
import DashboardPage       from "./pages/DashboardPage";
import CampaignsPage       from "./pages/CampaignsPage";
import CampaignDetailsPage from "./pages/CampaignDetails";
import CreateCampaignPage  from "./pages/CreateCampaignPage";
import DonationPage        from "./pages/DonationPage";
import NgoProfilePage      from "./pages/NgoProfilePage";
import MessagesPage        from "./pages/MessagesPage";
import ProfilePage         from "./pages/ProfilePage";
import SettingsPage        from "./pages/SettingsPage";
import ReportsPage         from "./pages/ImpactReportPage";
import AchievementsPage    from "./pages/AchievementsPage";
import NotFoundPage        from "./pages/NotFoundPage";
import NgoVolunteersPage   from "./pages/NgoVolunteersPage";

// Admin Pages
import AdminRegisterPage     from "./pages/admin/AdminRegisterPage";
import VerifyNGOsPage        from "./pages/admin/VerifyNGOsPage";
import AllUsersPage          from "./pages/admin/AllUsersPage";
import AdminDashboardPage    from "./pages/admin/AdminDashboardPage";
import AdminAnalyticsPage    from "./pages/admin/AdminAnalyticsPage";
import AdminVerificationPage from "./pages/admin/AdminVerificationPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* ── Auth pages (no layout) ─────────────────────────────────── */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/signup"         element={<SignupPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />

          {/* ── Admin-only routes → AdminLayout (sidebar + topbar) ──────
               Only accessible if user.role === "admin".       */}
          <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="/admin/dashboard"    element={<AdminDashboardPage />} />
            <Route path="/admin/verification" element={<AdminVerificationPage />} />
            <Route path="/admin/users"        element={<AllUsersPage />} />
            <Route path="/admin/analytics"    element={<AdminAnalyticsPage />} />
            <Route path="/admin/reports"      element={<ReportsPage />} />
            <Route path="/admin/messages"     element={<MessagesPage />} />
            <Route path="/admin/profile"      element={<ProfilePage />} />
            <Route path="/admin/settings"     element={<SettingsPage />} />
          </Route>

          {/* ── All other pages → regular Layout (Navbar + Footer) ────── */}
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />

            {/* Role-based Dashboard Redirect Component */}
            <Route path="/dashboard" element={<DashboardRouter />} />
            
            {/* User dashboard (for donor / ngo / volunteer) */}
            <Route path="/user/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

            <Route path="/campaigns"        element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
            <Route path="/campaigns/:id"    element={<ProtectedRoute><CampaignDetailsPage /></ProtectedRoute>} />
            <Route path="/donate/:id"       element={<ProtectedRoute><DonationPage /></ProtectedRoute>} />
            <Route path="/ngo/:id"          element={<NgoProfilePage />} />
            <Route path="/campaigns/create" element={<ProtectedRoute><CreateCampaignPage /></ProtectedRoute>} />
            <Route path="/reports"          element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/achievements"     element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
            <Route path="/ngo/volunteers"   element={<ProtectedRoute><NgoVolunteersPage /></ProtectedRoute>} />

            {/* Common authenticated pages for all roles */}
            <Route path="/messages"         element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/profile"          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/settings"         element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;