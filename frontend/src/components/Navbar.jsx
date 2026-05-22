// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import logo from "../assets/logo.png";
import ThemeToggle from "./ThemeToggle";
import useAuth from "../contexts/useAuth";
import {
  Bell, MessageSquare, LayoutDashboard,
  LogOut, User, Menu, X, ChevronDown,
} from "lucide-react";

const API        = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const SOCKET_URL = API.replace("/api", "");

// Singleton socket — same instance as MessagesPage uses
let socketInstance = null;
const getSocket = () => {
  if (!socketInstance) socketInstance = io(SOCKET_URL, { autoConnect: false });
  return socketInstance;
};

const Navbar = () => {
  const { user, logout, isAuthenticated, getToken } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const socket    = getSocket();

  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState([]); // toast queue
  const [showBell,      setShowBell]      = useState(false); // bell dropdown
  const [mobileOpen,    setMobileOpen]    = useState(false); // mobile menu
  const bellRef = useRef(null);

  // ── Fetch unread count from backend (polling every 30s + on mount) ─────────
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res   = await axios.get(`${API}/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(res.data.count || 0);
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, getToken]);

  // ── Socket: register + listen for real-time notification events ────────────
  useEffect(() => {
    if (!user) return;

    if (!socket.connected) socket.connect();
    socket.emit("register", user.uid);

    const onNotification = (notif) => {
      // bump badge
      setUnreadCount(prev => prev + 1);

      // push toast
      const id = Date.now();
      setNotifications(prev => [{ ...notif, id }, ...prev].slice(0, 5));
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    };

    // Listen for when our messages are read by the receiver
    const onMessagesRead = ({ by }) => {
      // Refresh unread count when someone reads our messages
      // This ensures the badge stays in sync
      const fetchUnread = async () => {
        try {
          const token = await user.getIdToken();
          const res   = await axios.get(`${API}/messages/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUnreadCount(res.data.count || 0);
        } catch {}
      };
      fetchUnread();
    };

    socket.on("notification", onNotification);
    socket.on("messages_read", onMessagesRead);
    return () => {
      socket.off("notification", onNotification);
      socket.off("messages_read", onMessagesRead);
    };
  }, [user]);

  // ── Close bell dropdown when clicking outside ─────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBell(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close mobile menu on route change ─────────────────────────────────────
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setUnreadCount(0);
    setNotifications([]);
    navigate("/login");
  };

  const handleMessagesClick = () => {
    setUnreadCount(0); // optimistically clear on click
    setShowBell(false);
    navigate("/messages");
  };

  const initials = user
    ? (user.firstName?.[0] || user.name?.[0] || "U").toUpperCase() +
      (user.lastName?.[0]  || user.name?.[1]  || "").toUpperCase()
    : "U";

  const isActive = (path) => location.pathname === path;

  const navLinkCls = (path) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive(path)
        ? "text-primary bg-primary/10 dark:bg-primary/20"
        : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  return (
    <>
      {/* ── Real-time notification toasts (top-right corner) ─────────────── */}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={handleMessagesClick}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 flex items-start gap-3 max-w-xs pointer-events-auto cursor-pointer hover:shadow-2xl transition-shadow animate-fade-in"
          >
            <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">New Message</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link to="/" className="shrink-0">
            <img src={logo} alt="United Impact" className="h-10 w-auto object-contain" />
          </Link>

          {/* ── Center nav links (desktop, only when NOT authenticated) ───── */}
          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <a href="/#features"    className={navLinkCls("")}>Features</a>
              <a href="/#how-it-works" className={navLinkCls("")}>How It Works</a>
              <a href="/#impact"      className={navLinkCls("")}>Impact</a>
            </div>
          )}

          {/* ── Center nav links (desktop, when authenticated) ─────────────── */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <Link to={user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard"}  className={navLinkCls(user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard")}>Dashboard</Link>
              <Link to="/campaigns"  className={navLinkCls("/campaigns")}>Campaigns</Link>
              {user?.role === "ngo" && (
                <Link to="/ngo/volunteers" className={navLinkCls("/ngo/volunteers")}>Volunteers</Link>
              )}
              {(user?.role === "ngo" || user?.role === "admin") && (
                <Link to="/reports"  className={navLinkCls("/reports")}>Reports</Link>
              )}
              {user?.role === "admin" && (
                <Link to="/admin/users" className={navLinkCls("/admin/users")}>Admin</Link>
              )}
            </div>
          )}

          {/* ── Right side ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Not logged in */}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="hidden md:inline-flex text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-bold text-white bg-primary hover:bg-blue-600 px-4 py-2 rounded-lg shadow-md shadow-primary/20 transition-all active:scale-[0.97]"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">

                {/* ── Bell / Messages icon with unread badge ─────────────── */}
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={() => setShowBell(prev => !prev)}
                    className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Messages & Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bell dropdown panel */}
                  {showBell && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">
                          <Bell className="w-7 h-7 mx-auto mb-2 opacity-20" />
                          No new notifications
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-64 overflow-y-auto">
                          {notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={handleMessagesClick}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">New Message</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.text}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-700 p-2">
                        <button
                          onClick={handleMessagesClick}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg py-2 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Open Messages
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Messages link (desktop shortcut) ───────────────────── */}
                <Link
                  to="/messages"
                  onClick={() => setUnreadCount(0)}
                  className={`hidden md:flex items-center gap-1.5 relative ${navLinkCls("/messages")}`}
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* ── Logout (desktop) ────────────────────────────────────── */}
                <button
                  onClick={handleLogout}
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>

                {/* ── Avatar / Profile ─────────────────────────────────────── */}
                <Link to="/profile" title="View Profile">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0 hover:scale-105 transition-transform hover:border-primary">
                    {user?.photoURL
                      ? <img src={user.photoURL} alt={initials} className="w-full h-full rounded-full object-cover" />
                      : initials
                    }
                  </div>
                </Link>

                {/* ── Mobile hamburger ────────────────────────────────────── */}
                <button
                  onClick={() => setMobileOpen(prev => !prev)}
                  className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}

            {/* Mobile hamburger for non-authenticated */}
            {!isAuthenticated && (
              <button
                onClick={() => setMobileOpen(prev => !prev)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile Menu Drawer ──────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-1 pb-2">
            {!isAuthenticated ? (
              <>
                <a href="/#features"     className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Features</a>
                <a href="/#how-it-works" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">How It Works</a>
                <a href="/#impact"       className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Impact</a>
                <div className="flex gap-2 mt-2 px-3">
                  <Link to="/login"  className="flex-1 text-center text-sm font-semibold py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">Sign In</Link>
                  <Link to="/signup" className="flex-1 text-center text-sm font-bold py-2 rounded-lg bg-primary text-white">Get Started</Link>
                </div>
              </>
            ) : (
              <>
                <Link to={user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard"} className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${isActive(user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard") ? "text-primary bg-primary/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/campaigns" className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${isActive("/campaigns") ? "text-primary bg-primary/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  Campaigns
                </Link>
                {user?.role === "ngo" && (
                  <Link to="/ngo/volunteers" className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${isActive("/ngo/volunteers") ? "text-primary bg-primary/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    Volunteers
                  </Link>
                )}
                <Link
                  to="/messages"
                  onClick={() => setUnreadCount(0)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${isActive("/messages") ? "text-primary bg-primary/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${isActive("/profile") ? "text-primary bg-primary/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <User className="w-4 h-4" /> Profile
                </Link>
                {(user?.role === "ngo" || user?.role === "admin") && (
                  <Link to="/reports" className={`px-3 py-2 text-sm font-medium rounded-lg ${isActive("/reports") ? "text-primary bg-primary/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    Reports
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link to="/admin/users" className={`px-3 py-2 text-sm font-medium rounded-lg ${isActive("/admin/users") ? "text-primary bg-primary/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="mt-1 mx-3 flex items-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
