import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, ArrowLeft, CheckCircle, XCircle, Clock,
  Search, Filter, Megaphone, Loader2, ChevronDown,
  Mail
} from "lucide-react";
import useAuth from "../contexts/useAuth";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const NgoVolunteersPage = () => {
  const navigate = useNavigate();
  const { user, getToken, isAuthenticated } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all NGO campaigns with volunteers
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await axios.get(`${API}/campaigns/ngo/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : res.data.campaigns || [];
        setCampaigns(data);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  // Flatten all volunteer requests with campaign info
  const allRequests = useMemo(() => {
    const requests = [];
    campaigns.forEach((camp) => {
      (camp.volunteers || []).forEach((vol) => {
        requests.push({
          ...vol,
          campaignId: camp._id,
          campaignTitle: camp.title,
          campaignStatus: camp.status,
          campaignImage: camp.imageUrl,
        });
      });
    });
    // Sort: pending first, then by joinedAt desc
    requests.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.joinedAt) - new Date(a.joinedAt);
    });
    return requests;
  }, [campaigns]);

  // Filtered list
  const filtered = useMemo(() => {
    return allRequests.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterCampaign !== "all" && r.campaignId !== filterCampaign) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (
          (r.name || "").toLowerCase().includes(q) ||
          (r.campaignTitle || "").toLowerCase().includes(q) ||
          (r.role || "").toLowerCase().includes(q) ||
          (r.message || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allRequests, filterStatus, filterCampaign, searchQ]);

  const counts = useMemo(() => ({
    all: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
  }), [allRequests]);

  const handleStatus = async (campaignId, volunteerUid, status) => {
    const key = `${campaignId}-${volunteerUid}`;
    try {
      setUpdatingId(key);
      const token = await getToken();
      await axios.patch(
        `${API}/campaigns/${campaignId}/volunteer/${volunteerUid}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local campaigns state
      setCampaigns((prev) =>
        prev.map((camp) => {
          if (camp._id !== campaignId) return camp;
          return {
            ...camp,
            volunteers: camp.volunteers.map((v) =>
              v.uid === volunteerUid ? { ...v, status } : v
            ),
          };
        })
      );
    } catch (err) {
      console.error("Failed to update volunteer:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const campaignOptions = useMemo(() => {
    return campaigns
      .filter((c) => (c.volunteers || []).length > 0)
      .map((c) => ({ id: c._id, title: c.title }));
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/user/dashboard")}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Volunteer Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", count: counts.all, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800" },
            { label: "Pending", count: counts.pending, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Approved", count: counts.approved, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Rejected", count: counts.rejected, color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search by name, campaign, or role..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-white placeholder-slate-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border rounded-lg transition-colors ${
                showFilters
                  ? "border-primary text-primary bg-primary/5"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Filter className="w-4 h-4" /> Filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
                <div className="flex gap-1">
                  {["all", "pending", "approved", "rejected"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        filterStatus === s
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {s === "all" ? `All (${counts.all})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s]})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign filter */}
              {campaignOptions.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Campaign:</span>
                  <select
                    value={filterCampaign}
                    onChange={(e) => setFilterCampaign(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">All Campaigns</option>
                    {campaignOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volunteer List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">
              {allRequests.length === 0 ? "No volunteer applications yet" : "No results match your filters"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {allRequests.length === 0
                ? "When volunteers sign up for your campaigns, they'll appear here."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req, idx) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const initials = (req.name || "V").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const isUpdating = updatingId === `${req.campaignId}-${req.uid}`;

              return (
                <div
                  key={`${req.campaignId}-${req.uid}-${idx}`}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-primary/20 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {req.name || "Anonymous Volunteer"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400 capitalize">{req.role || "Volunteer"}</span>
                          <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                          <span
                            className="text-xs text-primary hover:underline cursor-pointer truncate max-w-[200px]"
                            onClick={() => navigate(`/campaigns/${req.campaignId}`)}
                          >
                            {req.campaignTitle}
                          </span>
                          {req.joinedAt && (
                            <>
                              <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-xs text-slate-400">{fmtDate(req.joinedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge + Actions */}
                    <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>

                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatus(req.campaignId, req.uid, "approved")}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatus(req.campaignId, req.uid, "rejected")}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message if present */}
                  {req.message && (
                    <div className="mt-3 pl-14 flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{req.message}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default NgoVolunteersPage;
