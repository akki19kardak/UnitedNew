// frontend/src/pages/admin/AdminDashboardPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, DollarSign, TrendingUp,
  AlertCircle, CheckCircle2, Clock, ArrowRight, FileText,
  BarChart3, Activity, Calendar, RefreshCw, Shield, XCircle,
  MessageSquare  // ← ADD THIS
} from "lucide-react";
import useAuth from "../../contexts/useAuth";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const StatCard = ({ icon: Icon, label, value, subtitle, trend, color, onClick, badge }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 ${
      onClick ? "cursor-pointer hover:shadow-lg hover:border-blue-500" : ""
    } transition-all relative`}
  >
    {/* unread badge on card */}
    {badge > 0 && (
      <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

const ActivityItem = ({ type, title, subtitle, time, status, onClick }) => {
  const icons = {
    ngo_pending:      { icon: Building2,     color: "text-blue-600 bg-blue-50"   },
    campaign_pending: { icon: TrendingUp,    color: "text-purple-600 bg-purple-50" },
    user_joined:      { icon: Users,         color: "text-green-600 bg-green-50" },
    donation:         { icon: DollarSign,    color: "text-orange-600 bg-orange-50" },
    message:          { icon: MessageSquare, color: "text-pink-600 bg-pink-50"   },
  };
  const config = icons[type] || icons.ngo_pending;
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className={`p-2 rounded-lg ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 dark:text-white text-sm">{title}</p>
          <p className="text-xs text-slate-500">{subtitle} • {time}</p>
        </div>
      </div>
      {status && (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === "pending" ? "bg-yellow-100 text-yellow-700" :
          status === "approved" ? "bg-green-100 text-green-700" :
          "bg-red-100 text-red-700"
        }`}>
          {status}
        </span>
      )}
    </div>
  );
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0, totalNGOs: 0, verifiedNGOs: 0,
    totalCampaigns: 0, activeCampaigns: 0, totalDonations: 0,
    pendingNGOs: 0, pendingCampaigns: 0, pendingReports: 0,
    totalRaised: 0,
    unreadMessages: 0,   // ← NEW
    totalMessages: 0,    // ← NEW
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/admin/dashboard"); return; }
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token   = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [dashboardRes, unreadRes] = await Promise.all([
        fetch(`${API}/admin/dashboard`, { headers }).then(r => r.json()),
        // Fetch unread count for admin — same endpoint used by Navbar
        fetch(`${API}/messages/unread-count`, { headers })
          .then(r => r.json())
          .catch(() => ({ count: 0 })),
      ]);

      setStats({
        ...(dashboardRes.stats || {}),
        unreadMessages: unreadRes.count || 0,
        totalMessages:  dashboardRes.stats?.totalMessages || 0,
      });
      setRecentActivity(dashboardRes.recentActivity || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const formatDate = (date) => {
    const d       = new Date(date);
    const now     = new Date();
    const diffMs  = now - d;
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays  = Math.floor(diffMs / 86400000);
    if (diffMins  < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays  <  7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Welcome back, {user?.displayName || "Admin"}. Here's your overview.
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Grid — now 5 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={Users} label="Total Users"
            value={stats.totalUsers?.toLocaleString() || "0"}
            color="bg-blue-600"
            onClick={() => navigate("/admin/users")}
          />
          <StatCard
            icon={Building2} label="Verified NGOs"
            value={`${stats.verifiedNGOs || 0} / ${stats.totalNGOs || 0}`}
            subtitle={`${stats.pendingNGOs || 0} pending approval`}
            color="bg-green-600"
            onClick={() => navigate("/admin/verification?tab=ngos")}
          />
          <StatCard
            icon={TrendingUp} label="Active Campaigns"
            value={`${stats.activeCampaigns || 0} / ${stats.totalCampaigns || 0}`}
            subtitle={`${stats.pendingCampaigns || 0} pending approval`}
            color="bg-purple-600"
            onClick={() => navigate("/admin/verification?tab=campaigns")}
          />
          <StatCard
            icon={DollarSign} label="Total Raised"
            value={formatCurrency(stats.totalRaised || 0)}
            subtitle={`${stats.totalDonations || 0} donations`}
            trend={12}
            color="bg-orange-600"
            onClick={() => navigate("/admin/analytics")}
          />

          {/* ── NEW: Messages stat card ── */}
          <StatCard
            icon={MessageSquare} label="Messages"
            value={stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : "Inbox"}
            subtitle={stats.totalMessages > 0 ? `${stats.totalMessages} total messages` : "No messages yet"}
            color="bg-pink-600"
            badge={stats.unreadMessages}
            onClick={() => navigate("/admin/messages")}
          />
        </div>

        {/* Pending Approvals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div
            onClick={() => navigate("/admin/verification?tab=ngos")}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-lg hover:border-yellow-500 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">NGO Approvals</h3>
              </div>
              <span className="text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full text-sm font-bold">
                {stats.pendingNGOs || 0}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {stats.pendingNGOs || 0} NGO{stats.pendingNGOs !== 1 ? "s" : ""} awaiting verification
            </p>
            <button className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
              Review Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div
            onClick={() => navigate("/admin/verification?tab=campaigns")}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-lg hover:border-yellow-500 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campaign Approvals</h3>
              </div>
              <span className="text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full text-sm font-bold">
                {stats.pendingCampaigns || 0}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {stats.pendingCampaigns || 0} campaign{stats.pendingCampaigns !== 1 ? "s" : ""} awaiting approval
            </p>
            <button className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
              Review Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── NEW: Messages quick-access card ── */}
          <div
            onClick={() => navigate("/messages")}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-lg hover:border-pink-500 transition-all relative"
          >
            {stats.unreadMessages > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                {stats.unreadMessages > 9 ? "9+" : stats.unreadMessages}
              </span>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h3>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {stats.unreadMessages > 0
                ? `${stats.unreadMessages} unread message${stats.unreadMessages !== 1 ? "s" : ""} from users & NGOs`
                : "Chat with donors, NGOs and volunteers"}
            </p>
            <button className="flex items-center gap-2 text-pink-600 font-semibold text-sm hover:underline">
              Open Inbox <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h3>
            <button onClick={fetchDashboardData} className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-semibold">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">All caught up! No pending items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((item, idx) => (
                <ActivityItem
                  key={idx}
                  type={item.type}
                  title={item.title}
                  subtitle={item.subtitle}
                  time={formatDate(item.createdAt)}
                  status={item.status}
                  onClick={() => {
                    if (item.type === "ngo_pending")      navigate("/admin/verification?tab=ngos");
                    else if (item.type === "campaign_pending") navigate("/admin/verification?tab=campaigns");
                    else if (item.type === "message")     navigate("/messages");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions — now 5 buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate("/admin/verification")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
            Approvals
          </button>
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
          >
            <Users className="w-5 h-5" />
            Manage Users
          </button>
          <button
            onClick={() => navigate("/admin/analytics")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
          <button
            onClick={() => navigate("/admin/reports")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
          >
            <FileText className="w-5 h-5" />
            Reports
          </button>

          {/* ── NEW: Messages quick action button ── */}
          <button
            onClick={() => navigate("/messages")}
            className="relative flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Messages
            {stats.unreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                {stats.unreadMessages > 9 ? "9+" : stats.unreadMessages}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
