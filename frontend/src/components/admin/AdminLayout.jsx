// frontend/src/components/admin/AdminLayout.jsx
import { useState, useEffect } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, BarChart3,
  FileText, CheckCircle2, MessageSquare, Settings,
  LogOut, Shield, ChevronLeft, ChevronRight, Bell, User
} from "lucide-react";
import useAuth from "../../contexts/useAuth";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const NAV_ITEMS = [
  { to: "/admin/dashboard",    icon: LayoutDashboard, label: "Overview"              },
  { to: "/admin/verification", icon: CheckCircle2,    label: "Approvals", approvals: true },
  { to: "/admin/users",        icon: Users,           label: "Users"                 },
  { to: "/admin/analytics",    icon: BarChart3,       label: "Analytics"             },
  { to: "/admin/reports",      icon: FileText,        label: "Reports"               },
  { to: "/admin/messages",     icon: MessageSquare,   label: "Messages",  badge: true },
  { to: "/admin/settings",     icon: Settings,        label: "Settings"              },
];

const AdminLayout = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();

  const [collapsed,    setCollapsed]    = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchBadges = async () => {
      try {
        const token   = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [unreadRes, dashRes] = await Promise.all([
          axios.get(`${API}/messages/unread-count`, { headers })
            .catch(() => ({ data: { count: 0 } })),
          axios.get(`${API}/admin/dashboard`, { headers })
            .catch(() => ({ data: { stats: {} } })),
        ]);

        setUnreadCount(unreadRes.data.count || 0);
        const s = dashRes.data.stats || {};
        setPendingCount((s.pendingNGOs || 0) + (s.pendingCampaigns || 0));
      } catch {}
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user
    ? (user.firstName?.[0] || user.displayName?.[0] || user.name?.[0] || "A").toUpperCase()
    : "A";

  const adminName = user?.displayName || user?.firstName
    ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
    : "Admin";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`
          ${collapsed ? "w-16" : "w-60"}
          shrink-0 bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          flex flex-col transition-all duration-200
          sticky top-0 h-screen overflow-hidden z-40
        `}
      >
        {/* Logo + collapse toggle */}
        <div
          className={`
            flex items-center
            ${collapsed ? "justify-center px-3" : "justify-between px-4"}
            py-5 border-b border-slate-200 dark:border-slate-800
          `}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Admin Panel
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft  className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, badge, approvals }) => {
            const badgeCount = badge
              ? unreadCount
              : approvals
              ? pendingCount
              : 0;

            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-sm font-medium transition-all
                  ${isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }
                `}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />

                {!collapsed && (
                  <span className="truncate flex-1">{label}</span>
                )}

                {/* Badge */}
                {badgeCount > 0 && (
                  <span
                    className={`
                      ${collapsed
                        ? "absolute -top-0.5 -right-0.5"
                        : "ml-auto"
                      }
                      bg-red-500 text-white text-[10px] font-bold rounded-full
                      min-w-[18px] h-[18px] flex items-center justify-center px-0.5
                    `}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile + Logout at bottom */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-1">
          <NavLink
            to="/admin/profile"
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors
              ${isActive
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }
            `}
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {adminName}
                </p>
                <p className="text-[10px] text-slate-400">Administrator</p>
              </div>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
          <div />

          <div className="flex items-center gap-2">

            {/* Messages bell */}
            <button
              onClick={() => navigate("/admin/messages")}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Approvals bell */}
            {pendingCount > 0 && (
              <button
                onClick={() => navigate("/admin/verification")}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={`${pendingCount} pending approvals`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              </button>
            )}

            {/* Profile avatar */}
            <button
              onClick={() => navigate("/admin/profile")}
              className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm hover:bg-blue-700 transition-colors"
              title="Profile"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content rendered here via Outlet */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
