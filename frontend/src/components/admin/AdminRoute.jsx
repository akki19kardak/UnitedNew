// frontend/src/components/admin/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../contexts/useAuth";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Still loading Firebase + MongoDB user — wait, don't redirect yet
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Not logged in at all
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Logged in but not admin — redirect to dashboard router which will
  // then redirect to the appropriate user dashboard
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  // Admin confirmed — render children (which is AdminLayout with <Outlet />)
  return children;
};

export default AdminRoute;
