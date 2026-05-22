import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Megaphone, BarChart2, Settings,
  LogOut, Bell, Search, Heart, Clock, Star, Users,
  ChevronRight, BadgeCheck, Building2, CalendarDays,
  FileText, ShieldCheck, PlusCircle, TrendingUp, Loader2
} from "lucide-react";
import useAuth from "../contexts/useAuth";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import ActivityFeed from "../components/admin/ActivityFeed";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// -- XP & Level System ----------------------------------------
const calcLevel = (xp) => Math.floor(Math.sqrt(Math.max(xp, 0) / 50)) + 1;
const xpForLevel = (lvl) => Math.pow(lvl - 1, 2) * 50;
const xpForNextLevel = (lvl) => Math.pow(lvl, 2) * 50;
const levelTheme = (level) => {
  if (level >= 20) return { label: "Legendary", color: "text-purple-500", bg: "from-purple-500 to-pink-500", ring: "ring-purple-500/30" };
  if (level >= 15) return { label: "Diamond", color: "text-sky-400", bg: "from-sky-400 to-blue-600", ring: "ring-sky-400/30" };
  if (level >= 10) return { label: "Gold", color: "text-amber-400", bg: "from-amber-400 to-yellow-500", ring: "ring-amber-400/30" };
  if (level >= 5) return { label: "Silver", color: "text-slate-400", bg: "from-slate-400 to-slate-500", ring: "ring-slate-400/30" };
  return { label: "Bronze", color: "text-orange-400", bg: "from-orange-400 to-amber-500", ring: "ring-orange-400/30" };
};

const NavLink = ({ icon: Icon, label, active, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left
      ${danger
        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        : active
          ? "bg-primary text-white"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
  >
    <Icon className="w-5 h-5 shrink-0" />
    {label}
  </button>
);

const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, badge, badgeColor }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      {badge && (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>{badge}</span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1 truncate">{value}</p>
    </div>
  </div>
);

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg ${className}`} />
);

const BarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (
    <div>
      <div className="h-56 flex items-end gap-1.5">
        {data.map((d, i) => {
          const h = Math.max((d.amount / max) * 100, 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${h}%`, minHeight: "6px" }}>
                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/5" />
                <div className="absolute bottom-0 w-full bg-primary rounded-t-lg group-hover:opacity-80 transition-opacity" style={{ height: "100%" }} />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  ₹{fmt(d.amount)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 font-medium">
            {months[d.month - 1] || months[i]}
          </div>
        ))}
      </div>
    </div>
  );
};

const NAV_ITEMS = {
  donor: [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", to: "/user/dashboard" },
    { id: "campaigns", icon: Megaphone, label: "Campaigns", to: "/campaigns" },
    { id: "reports", icon: BarChart2, label: "Impact Reports", to: "/reports" },
    { id: "achievements", icon: Star, label: "Achievements", to: "/achievements" },
  ],
  volunteer: [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", to: "/user/dashboard" },
    { id: "campaigns", icon: Megaphone, label: "Browse Campaigns", to: "/campaigns" },
    { id: "schedule", icon: CalendarDays, label: "My Schedule", to: "/user/dashboard" },
    { id: "achievements", icon: Star, label: "Achievements", to: "/achievements" },
    { id: "reports", icon: BarChart2, label: "Impact Reports", to: "/reports" },
  ],
  ngo: [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", to: "/user/dashboard" },
    { id: "campaigns", icon: Megaphone, label: "My Campaigns", to: "/campaigns" },
    { id: "create", icon: PlusCircle, label: "Create Campaign", to: "/campaigns/create" },
    { id: "volunteers", icon: Users, label: "Volunteers", to: "/ngo/volunteers" },
    { id: "reports", icon: BarChart2, label: "Impact Reports", to: "/reports" },
    { id: "messages", icon: FileText, label: "Messages", to: "/messages" },
  ],
  admin: [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", to: "/admin/dashboard" },
    { id: "verification", icon: ShieldCheck, label: "Verify NGOs", to: "/admin/verification" },
    { id: "campaigns", icon: Megaphone, label: "All Campaigns", to: "/campaigns" },
    { id: "users", icon: Users, label: "All Users", to: "/admin/users" },
    { id: "reports", icon: BarChart2, label: "Reports", to: "/admin/reports" },
    { id: "messages", icon: FileText, label: "Messages", to: "/admin/messages" },
  ],
};

const ROLE_STATS = {
  donor: (stats) => [
    { icon: Heart, iconBg: "bg-rose-50 dark:bg-rose-900/30", iconColor: "text-rose-500", label: "Total Donated", value: `₹${fmt(stats?.totalDonated || 0)}`, badge: `${stats?.donationCount || 0} donations`, badgeColor: "text-rose-600 bg-rose-50 dark:bg-rose-900/30" },
    { icon: Megaphone, iconBg: "bg-blue-50 dark:bg-blue-900/30", iconColor: "text-primary", label: "Campaigns Supported", value: stats?.campaignsSupported || 0, badge: "Active", badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
    { icon: Users, iconBg: "bg-emerald-50 dark:bg-emerald-900/30", iconColor: "text-emerald-500", label: "People Impacted", value: stats?.peopleHelped || "~0", badge: "Est.", badgeColor: "text-slate-500 bg-slate-50 dark:bg-slate-800" },
    { icon: BadgeCheck, iconBg: "bg-purple-50 dark:bg-purple-900/30", iconColor: "text-purple-500", label: "Impact Score", value: stats?.impactScore || 0, badge: "Points", badgeColor: "text-purple-600 bg-purple-50 dark:bg-purple-900/30" },
  ],
  volunteer: (stats) => [
    { icon: Clock, iconBg: "bg-blue-50 dark:bg-blue-900/30", iconColor: "text-primary", label: "Hours Volunteered", value: `${stats?.hoursLogged || 0} hrs`, badge: "This Year", badgeColor: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
    { icon: Megaphone, iconBg: "bg-emerald-50 dark:bg-emerald-900/30", iconColor: "text-emerald-500", label: "Campaigns Joined", value: stats?.campaignsJoined || 0, badge: "Total", badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
    { icon: Users, iconBg: "bg-amber-50 dark:bg-amber-900/30", iconColor: "text-amber-500", label: "People Helped", value: `~${stats?.peopleHelped || 0}`, badge: "Est.", badgeColor: "text-slate-500 bg-slate-50 dark:bg-slate-800" },
    { icon: BadgeCheck, iconBg: "bg-purple-50 dark:bg-purple-900/30", iconColor: "text-purple-500", label: "Approved Campaigns", value: stats?.approvedCampaigns || 0, badge: "Verified", badgeColor: "text-purple-600 bg-purple-50 dark:bg-purple-900/30" },
  ],
  ngo: (stats) => [
    { icon: Megaphone, iconBg: "bg-blue-50 dark:bg-blue-900/30", iconColor: "text-primary", label: "Active Campaigns", value: stats?.activeCampaigns || 0, badge: "Live", badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
    { icon: Heart, iconBg: "bg-rose-50 dark:bg-rose-900/30", iconColor: "text-rose-500", label: "Total Raised", value: `₹${fmt(stats?.totalRaised || 0)}`, badge: "All Time", badgeColor: "text-rose-600 bg-rose-50 dark:bg-rose-900/30" },
    { icon: Users, iconBg: "bg-emerald-50 dark:bg-emerald-900/30", iconColor: "text-emerald-500", label: "Total Donors", value: stats?.totalDonors || 0, badge: "Supporters", badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
    { icon: TrendingUp, iconBg: "bg-purple-50 dark:bg-purple-900/30", iconColor: "text-purple-500", label: "Total Donations", value: stats?.totalDonations || 0, badge: "Received", badgeColor: "text-purple-600 bg-purple-50 dark:bg-purple-900/30" },
  ],
  admin: (stats) => [
    { icon: Building2, iconBg: "bg-blue-50 dark:bg-blue-900/30", iconColor: "text-primary", label: "Pending NGOs", value: stats?.pendingNGOs || 0, badge: "Needs Review", badgeColor: "text-amber-600 bg-amber-50 dark:bg-amber-900/30" },
    { icon: Megaphone, iconBg: "bg-emerald-50 dark:bg-emerald-900/30", iconColor: "text-emerald-500", label: "Total Campaigns", value: stats?.totalCampaigns || 0, badge: "Platform-wide", badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
    { icon: Users, iconBg: "bg-amber-50 dark:bg-amber-900/30", iconColor: "text-amber-500", label: "Registered Users", value: stats?.totalUsers || 0, badge: "All Roles", badgeColor: "text-slate-500 bg-slate-50 dark:bg-slate-800" },
    { icon: Heart, iconBg: "bg-rose-50 dark:bg-rose-900/30", iconColor: "text-rose-500", label: "Total Donated", value: `₹${fmt(stats?.platformDonations || 0)}`, badge: "Platform", badgeColor: "text-rose-600 bg-rose-50 dark:bg-rose-900/30" },
  ],
};

const ROLE_SUBTITLE = {
  donor: "Track your donations and discover new causes to support.",
  volunteer: "See your upcoming events and volunteer hours.",
  ngo: "Manage your campaigns and monitor fundraising progress.",
  admin: "Review pending NGOs and monitor platform activity.",
};

const ROLE_ACTIONS = {
  donor: [{ label: "Donate Now", to: "/campaigns", color: "bg-primary" }, { label: "View Reports", to: "/reports", color: "bg-emerald-500" }],
  volunteer: [{ label: "Find Opportunities", to: "/campaigns", color: "bg-primary" }, { label: "My Achievements", to: "/achievements", color: "bg-purple-500" }],
  ngo: [{ label: "Create Campaign", to: "/campaigns/create", color: "bg-primary" }, { label: "View Reports", to: "/reports", color: "bg-emerald-500" }],
  admin: [{ label: "Verify NGOs", to: "/admin/verification", color: "bg-amber-500" }, { label: "View All Campaigns", to: "/campaigns", color: "bg-primary" }],
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, getToken, logout, isAuthenticated } = useAuth();

  const role = user?.role;

  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [searchQ, setSearchQ] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatingVolunteer, setUpdatingVolunteer] = useState(null);

  const handleVolunteerStatus = async (campaignId, volunteerUid, status) => {
    try {
      setUpdatingVolunteer(`${campaignId}-${volunteerUid}`);
      const token = await getToken();
      await axios.patch(`${API}/campaigns/${campaignId}/volunteer/${volunteerUid}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local state
      setVolunteerRequests((prev) =>
        prev.map((r) =>
          r.campaignId === campaignId && r.uid === volunteerUid ? { ...r, status } : r
        )
      );
    } catch (err) {
      console.error("Failed to update volunteer status:", err);
    } finally {
      setUpdatingVolunteer(null);
    }
  };

  useEffect(() => {
    const load = async (isBackground = false) => {
      // ✅ FIX 1: Ensure user AND role exist before fetching
      if (!isAuthenticated || !user || !role) return;

      if (!isBackground) setLoading(true);
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        let loadedCampaigns = [];
        let loadedDonations = [];

        if (role === "donor") {
          const donRes = await axios.get(`${API}/donations/my`, { headers });
          loadedDonations = Array.isArray(donRes.data) ? donRes.data : donRes.data.donations || [];

          const campRes = await axios.get(`${API}/campaigns?status=active`);
          loadedCampaigns = Array.isArray(campRes.data) ? campRes.data.slice(0, 4) : campRes.data.campaigns?.slice(0, 4) || [];

          const completed = loadedDonations.filter((d) => d.status === "completed" || !d.status);
          const totalDonated = completed.reduce((s, d) => s + (Number(d.amount) || 0), 0);
          const uniqueCampaigns = new Set(completed.map(d => typeof d.campaignId === "object" ? d.campaignId._id : d.campaignId)).size;

          setStats({
            totalDonated,
            donationCount: loadedDonations.length,
            campaignsSupported: uniqueCampaigns,
            impactScore: Math.min(Math.floor(totalDonated / 1000), 100),
          });

          // Compute Achievements explicitly for Dashboard
          const xp = Math.floor(totalDonated / 10) + (loadedDonations.length * 5) + (uniqueCampaigns * 20);
          setAchievements({ xp, level: calcLevel(xp) });

        } else if (role === "ngo") {
          const campRes = await axios.get(`${API}/campaigns/ngo/mine`, { headers });
          loadedCampaigns = Array.isArray(campRes.data) ? campRes.data : campRes.data.campaigns || [];

          // Collect volunteer requests from all campaigns
          const allRequests = [];
          loadedCampaigns.forEach((camp) => {
            (camp.volunteers || []).forEach((vol) => {
              allRequests.push({ ...vol, campaignId: camp._id, campaignTitle: camp.title });
            });
          });
          // Sort: pending first, then by joinedAt desc
          allRequests.sort((a, b) => {
            if (a.status === "pending" && b.status !== "pending") return -1;
            if (a.status !== "pending" && b.status === "pending") return 1;
            return new Date(b.joinedAt) - new Date(a.joinedAt);
          });
          setVolunteerRequests(allRequests);

          try {
            const statsRes = await axios.get(`${API}/donations/ngo/stats`, { headers });
            setStats(statsRes.data);
          } catch (error) {
            setStats({
              activeCampaigns: loadedCampaigns.filter(c => c.status === "active").length,
              totalRaised: loadedCampaigns.reduce((a, b) => a + (b.currentAmount || 0), 0),
              totalDonors: 0,
              totalDonations: 0,
            });
          }

        } else if (role === "volunteer") {
          const campRes = await axios.get(`${API}/campaigns?status=active`);
          loadedCampaigns = Array.isArray(campRes.data) ? campRes.data.slice(0, 4) : campRes.data.campaigns?.slice(0, 4) || [];

          let volStats = { campaignsJoined: 0, approvedCampaigns: 0, hoursLogged: 0, peopleHelped: 0 };
          try {
            const statsRes = await axios.get(`${API}/donations/volunteer/stats`, { headers });
            volStats = statsRes.data;
            setStats(volStats);
          } catch (error) {
            setStats(volStats);
          }

          // Fetch volunteer schedule (real-time)
          try {
            const schedRes = await axios.get(`${API}/donations/volunteer/schedule`, { headers });
            setSchedule(Array.isArray(schedRes.data) ? schedRes.data : []);
          } catch (e) {
            setSchedule([]);
          }

          // Volunteer Achievements — uses volStats directly (no race condition)
          try {
            const donRes = await axios.get(`${API}/donations/my`, { headers });
            const allDonations = Array.isArray(donRes.data) ? donRes.data : [];
            const completed = allDonations.filter(d => d.status === "completed" || !d.status);
            const tDonated = completed.reduce((s, d) => s + (Number(d.amount) || 0), 0);
            const uCampaigns = new Set(completed.map(d => typeof d.campaignId === "object" ? d.campaignId._id : d.campaignId)).size;

            const xp = Math.floor(tDonated / 10)
              + (allDonations.length * 5)
              + (uCampaigns * 20)
              + (volStats.hoursLogged || 0) * 50
              + (volStats.approvedCampaigns || 0) * 30;
            setAchievements({ xp, level: calcLevel(xp) });
          } catch (e) {
            setAchievements({ xp: 0, level: 1 });
          }

        } else if (role === "admin") {
          // Admin data fetch
          try {
            const adminRes = await axios.get(`${API}/admin/dashboard`, { headers });
            setStats(adminRes.data.stats || {
              pendingNGOs: 0,
              totalCampaigns: 0,
              totalUsers: 0,
              platformDonations: 0
            });

            // The chart needs 'completed' donations and 'loadedCampaigns'
            // To not break the generic code below, we just provide empty arrays or fetch campaigns if needed.
            // But admin stats are already processed by backend. Let's provide empty arrays for the generic logic.
            loadedCampaigns = [];
            loadedDonations = [];
          } catch (error) {
            setStats({
              pendingNGOs: 0,
              totalCampaigns: 0,
              totalUsers: 0,
              platformDonations: 0
            });
          }
        }

        // Generate Chart Data
        const completed = loadedDonations.filter((d) => d.status === "completed" || !d.status);
        const monthly = {};
        completed.forEach((d) => {
          const m = new Date(d.createdAt).getMonth() + 1;
          monthly[m] = (monthly[m] || 0) + (Number(d.amount) || 0);
        });

        const chart = Array.from({ length: 7 }, (_, i) => {
          const m = new Date().getMonth() - 6 + i + 1;
          const adj = m <= 0 ? m + 12 : m;
          return { month: adj, amount: monthly[adj] || 0 };
        });

        setDonations(loadedDonations);
        setCampaigns(loadedCampaigns);
        setChartData(chart);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();

    // Poll every 30 seconds for real-time data updates
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [user, role, getToken, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">Setting up your account...</p>
          <p className="text-sm text-slate-500 mt-2">Please complete role selection</p>
        </div>
      </div>
    );
  }

  const fullName = user?.name || user?.displayName || "User";
  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const navItems = NAV_ITEMS[role] || NAV_ITEMS.donor;
  const statCards = (ROLE_STATS[role] || ROLE_STATS.donor)(stats);
  const quickActions = ROLE_ACTIONS[role] || ROLE_ACTIONS.donor;

  const SidebarContent = ({ mobile = false }) => (
    <div className={`relative flex flex-col h-full w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 ${mobile ? "shadow-2xl" : ""}`}>
      <div className="px-5 py-3 mb-2">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3 border border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{fullName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, icon, label, to }) => (
          <NavLink
            key={id}
            icon={icon}
            label={label}
            active={activeNav === id}
            onClick={() => { setActiveNav(id); navigate(to); setSidebarOpen(false); }}
          />
        ))}

        <div className="pt-4 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider px-4">Account</div>

        <NavLink
          icon={Settings}
          label="Settings"
          active={activeNav === "settings"}
          onClick={() => { setActiveNav("settings"); navigate("/settings"); setSidebarOpen(false); }}
        />
        <NavLink
          icon={BadgeCheck}
          label="My Profile"
          active={activeNav === "profile"}
          onClick={() => { setActiveNav("profile"); navigate("/profile"); setSidebarOpen(false); }}
        />
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <NavLink icon={LogOut} label="Sign Out" danger onClick={handleLogout} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 font-display">
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button className="lg:hidden text-slate-500 hover:text-primary" onClick={() => setSidebarOpen(true)}>
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/campaigns")} className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              <Megaphone className="w-4 h-4" /> Explore
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle />
            <button className="relative text-slate-500 hover:text-primary">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs hover:bg-primary/20 transition-colors">
              {initials}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back, {user?.name?.split(" ")[0] || "there"}! 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {ROLE_SUBTITLE[role]}
              </p>
            </div>
            <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize border
              ${role === "admin" ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800" :
                role === "ngo" ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800" :
                  role === "volunteer" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" :
                    "bg-blue-50 text-primary border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"}`}
            >
              {role === "admin" ? "🛡 Admin" : role === "ngo" ? "🏢 NGO" : role === "volunteer" ? "🙋 Volunteer" : "💙 Donor"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {quickActions.map(({ label, to, color }) => (
              <button key={label} onClick={() => navigate(to)} className={`${color} text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.97] shadow-sm`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card) => <StatCard key={card.label} {...card} />)}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {(role === "donor" || role === "ngo") && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg">{role === "ngo" ? "Fundraising Trends" : "Donation Trends"}</h3>
                    <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">Last 7 months</span>
                  </div>
                  {loading ? <Skeleton className="h-56" /> : <BarChart data={chartData} />}
                </div>
              )}

              {/* My Schedule -- Volunteer */}
              {role === "volunteer" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg">My Schedule</h3>
                    </div>
                    <button
                      onClick={() => navigate("/campaigns")}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Find more →
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                    </div>
                  ) : schedule.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium text-sm">No upcoming commitments</p>
                      <p className="text-xs mt-1">Browse campaigns and sign up to volunteer!</p>
                      <button
                        onClick={() => navigate("/campaigns")}
                        className="mt-4 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Browse Campaigns
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedule.map((item) => {
                        const statusColors = {
                          approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                          pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        };
                        const campaignActive = item.status === "active" && item.approvalStatus === "approved";
                        return (
                          <button
                            key={item._id}
                            onClick={() => navigate(`/campaigns/${item._id}`)}
                            className="w-full flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
                          >
                            {/* Campaign image or color block */}
                            <div
                              className="w-12 h-12 rounded-lg shrink-0 bg-primary/10 flex items-center justify-center overflow-hidden"
                              style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                            >
                              {!item.imageUrl && <Megaphone className="w-6 h-6 text-primary" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{item.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-slate-400 capitalize">{item.volunteerRole}</span>
                                {item.location?.city && (
                                  <span className="text-xs text-slate-400">• {item.location.city}</span>
                                )}
                                {item.startDate && (
                                  <span className="text-xs text-slate-400">• {fmtDate(item.startDate)}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[item.volunteerStatus] || statusColors.pending}`}>
                                {item.volunteerStatus.charAt(0).toUpperCase() + item.volunteerStatus.slice(1)}
                              </span>
                              {item.hoursLogged > 0 && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{item.hoursLogged}h logged
                                </span>
                              )}
                              {!campaignActive && (
                                <span className="text-[10px] text-amber-500">Under review</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Volunteer Requests -- NGO */}
              {role === "ngo" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-bold text-lg">Volunteer Requests</h3>
                      {volunteerRequests.filter(v => v.status === "pending").length > 0 && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                          {volunteerRequests.filter(v => v.status === "pending").length} pending
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate("/ngo/volunteers")}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                  ) : volunteerRequests.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium text-sm">No volunteer applications yet</p>
                      <p className="text-xs mt-1">Applications will appear here when volunteers sign up for your campaigns.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {volunteerRequests.slice(0, 8).map((req, idx) => {
                        const statusColors = {
                          approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                          pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        };
                        const initials = (req.name || "V").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                        return (
                          <div
                            key={idx}
                            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/campaigns/${req.campaignId}`)}>
                              <p className="font-semibold text-sm truncate">{req.name || "Anonymous Volunteer"}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-xs text-slate-400 capitalize">{req.role || "Volunteer"}</span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-400 truncate max-w-[120px]">{req.campaignTitle}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[req.status] || statusColors.pending}`}>
                                {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                              </span>
                              {req.joinedAt && (
                                <span className="text-[10px] text-slate-400">{fmtDate(req.joinedAt)}</span>
                              )}
                              {req.status === "pending" && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleVolunteerStatus(req.campaignId, req.uid, "approved")}
                                    disabled={updatingVolunteer === `${req.campaignId}-${req.uid}`}
                                    className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                  >
                                    {updatingVolunteer === `${req.campaignId}-${req.uid}` ? "..." : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => handleVolunteerStatus(req.campaignId, req.uid, "rejected")}
                                    disabled={updatingVolunteer === `${req.campaignId}-${req.uid}`}
                                    className="px-2.5 py-1 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-6">
              {(role === "donor" || role === "volunteer") && achievements && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/achievements")}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      Your Impact
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${levelTheme(achievements.level).bg} flex items-center justify-center text-white font-extrabold text-xl shadow-lg ring-4 ${levelTheme(achievements.level).ring}`}>
                      {achievements.level}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Level {achievements.level}</p>
                      <p className={`font-bold text-lg leading-tight mb-1 ${levelTheme(achievements.level).color}`}>
                        {levelTheme(achievements.level).label} Tier
                      </p>

                      {/* Mini XP Bar */}
                      {(() => {
                        const currXP = achievements.xp - xpForLevel(achievements.level);
                        const needXP = xpForNextLevel(achievements.level) - xpForLevel(achievements.level);
                        const pct = Math.min(Math.round((currXP / needXP) * 100), 100);
                        return (
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>{fmt(achievements.xp)} XP</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {role === "admin" && <ActivityFeed />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
