import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Building2, Heart, HandHelping, ShieldCheck,
  Loader2, ArrowLeft, Search, BadgeCheck,
} from "lucide-react";
import useAuth from "../../contexts/useAuth";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ROLE_BADGE = {
  donor: "bg-blue-50 text-blue-600 dark:bg-blue-900/30",
  ngo: "bg-purple-50 text-purple-600 dark:bg-purple-900/30",
  volunteer: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30",
  admin: "bg-red-50 text-red-600 dark:bg-red-900/30",
};

const AllUsersPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API}/users/admin/all-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users);
        setStats(res.data.stats);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [getToken]);

  const filtered = users.filter((u) => {
    const q = searchQ.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.organizationName?.toLowerCase().includes(q)
    );
  });

  const statCards = stats
    ? [
        { icon: Users, bg: "bg-blue-50 dark:bg-blue-900/30", color: "text-blue-500", label: "Total Users", value: stats.total },
        { icon: Heart, bg: "bg-rose-50 dark:bg-rose-900/30", color: "text-rose-500", label: "Donors", value: stats.donors },
        { icon: Building2, bg: "bg-purple-50 dark:bg-purple-900/30", color: "text-purple-500", label: "NGOs", value: `${stats.ngos} (${stats.verifiedNGOs} verified)` },
        { icon: HandHelping, bg: "bg-emerald-50 dark:bg-emerald-900/30", color: "text-emerald-500", label: "Volunteers", value: stats.volunteers },
      ]
    : [];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Users</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage platform users</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(({ icon: Icon, bg, color, label, value }) => (
                <div
                  key={label}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search by name, email, role..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                    <th className="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Name</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Email</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Role</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u._id}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                        <div>
                          {u.name}
                          {u.organizationName && (
                            <p className="text-xs text-slate-400 mt-0.5">{u.organizationName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            ROLE_BADGE[u.role] || "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.role || "unset"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {u.role === "ngo" ? (
                          u.isVerified ? (
                            <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                              <BadgeCheck className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" /> Pending
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {fmtDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllUsersPage;
