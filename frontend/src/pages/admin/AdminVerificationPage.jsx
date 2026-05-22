import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, CheckCircle, XCircle, LogOut,
  Loader2, AlertTriangle, Building2, FileText,
  Eye, BadgeCheck, Clock, Users,
} from "lucide-react";
import useAuth from "../../contexts/useAuth";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const StatusBadge = ({ status }) => {
  const map = {
    pending: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    active: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    inactive: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${map[status] || map.inactive}`}>
      {status}
    </span>
  );
};

const AdminVerificationPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("campaigns"); // "campaigns" | "ngos" | "verified-ngos"
  const [campaigns, setCampaigns] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [verifiedNgos, setVerifiedNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // id being actioned
  const [rejectModal, setRejectModal] = useState(null);   // { id, type }
  const [rejectReason, setRejectReason] = useState("");

  // ── Fetch all data ─────────────────────────────────────────
  const fetchAll = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    if (!isBackground) setError("");
    try {
      const token = await user?.getIdToken?.();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [campRes, ngoAllRes] = await Promise.all([
        axios.get(`${API}/campaigns?status=pending`, { headers }),
        axios.get(`${API}/admin/ngos`, { headers }),
      ]);

      const allCamps = Array.isArray(campRes.data)
        ? campRes.data
        : campRes.data.campaigns || campRes.data.data || [];
      setCampaigns(allCamps);

      const allNgos = Array.isArray(ngoAllRes.data)
        ? ngoAllRes.data
        : ngoAllRes.data.ngos || ngoAllRes.data || [];

      setNgos(allNgos.filter((n) => n.status === "pending"));
      setVerifiedNgos(allNgos.filter((n) => n.status === "approved" && n.isVerified));
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load data. " + (err.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Campaign approve/reject ────────────────────────────────
  const handleCampaignAction = async (id, action, reason = "") => {
    setActionLoading(id);
    try {
      const token = await user?.getIdToken?.();
      const status = action === "approve" ? "approved" : "rejected";
      await axios.patch(
        `${API}/campaigns/${id}/status`,
        { status, ...(reason && { rejectionReason: reason }) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      setRejectModal(null);
      setRejectReason("");
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // ── NGO approve/reject ─────────────────────────────────────
  const handleNgoAction = async (id, action, reason = "") => {
    setActionLoading(id);
    try {
      const token = await user?.getIdToken?.();
      const status = action === "approve" ? "approved" : "rejected";
      await axios.patch(
        `${API}/ngos/${id}/verify`,
        { status, ...(reason && { rejectionReason: reason }) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNgos((prev) => prev.filter((n) => n._id !== id));
      if (action === "approve") await fetchAll(); // refresh verified list
      setRejectModal(null);
      setRejectReason("");
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id, type) => {
    setRejectModal({ id, type });
    setRejectReason("");
  };

  const submitReject = () => {
    if (!rejectReason.trim()) return alert("Please enter a rejection reason.");
    if (rejectModal.type === "campaign") handleCampaignAction(rejectModal.id, "reject", rejectReason);
    else handleNgoAction(rejectModal.id, "reject", rejectReason);
  };

  const TABS = [
    { key: "campaigns", label: "Pending Campaigns", icon: FileText, count: campaigns.length },
    { key: "ngos", label: "Pending NGOs", icon: Building2, count: ngos.length },
    { key: "verified-ngos", label: "Verified NGOs", icon: BadgeCheck, count: verifiedNgos.length },
  ];

  return (
    <div className="flex flex-1 bg-slate-50 dark:bg-slate-950 font-display overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Panel</h2>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300 font-medium"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/campaigns")}
            className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300 font-medium"
          >
            All Campaigns
          </button>
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium text-sm mt-4"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
            Verification Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Review NGO registrations and campaign submissions
          </p>

          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                  ${activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key
                      ? "bg-primary text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* ── Pending Campaigns Tab ── */}
              {activeTab === "campaigns" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {campaigns.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No pending campaigns</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            {["Campaign", "NGO", "Category", "Goal", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {campaigns.map((c) => {
                            const ngo = typeof c.ngoId === "object" ? c.ngoId : null;
                            return (
                              <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-5 py-4 max-w-[200px]">
                                  <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">{c.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{c.shortDescription || c.description}</p>
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  {ngo?.name || ngo?.organizationName || c.ngoId || "—"}
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded capitalize">
                                    {c.category?.replace(/-/g, " ") || "—"}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                  ₹{fmt(c.goalAmount || c.targetAmount)}
                                </td>
                                <td className="px-5 py-4">
                                  <StatusBadge status={c.approvalStatus || c.status} />
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => navigate(`/campaigns/${c._id}`)}
                                      className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                      title="Preview"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCampaignAction(c._id, "approve")}
                                      disabled={actionLoading === c._id}
                                      className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                      title="Approve"
                                    >
                                      {actionLoading === c._id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <CheckCircle className="w-4 h-4" />
                                      }
                                    </button>
                                    <button
                                      onClick={() => openRejectModal(c._id, "campaign")}
                                      disabled={actionLoading === c._id}
                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                      title="Reject"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Pending NGOs Tab ── */}
              {activeTab === "ngos" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {ngos.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No pending NGO registrations</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            {["NGO Name", "Email", "Cause", "Darpan ID", "Location", "Registered", "Actions"].map((h) => (
                              <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {ngos.map((n) => (
                            <tr key={n._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-sm font-black text-primary">
                                    {(n.name || "N")[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{n.name}</p>
                                    <p className="text-xs text-slate-400">{n.phone || "No phone"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{n.email}</td>
                              <td className="px-5 py-4">
                                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded capitalize">
                                  {n.cause?.replace(/-/g, " ") || "—"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                                {n.darpanId || (
                                  <span className="text-amber-500 text-xs">Not provided</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-500">
                                {[n.city, n.state].filter(Boolean).join(", ") || "—"}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-400">
                                {n.createdAt
                                  ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "—"}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => navigate(`/ngo/${n._id}`)}
                                    className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="View Profile"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleNgoAction(n._id, "approve")}
                                    disabled={actionLoading === n._id}
                                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Verify & Approve"
                                  >
                                    {actionLoading === n._id
                                      ? <Loader2 className="w-4 h-4 animate-spin" />
                                      : <CheckCircle className="w-4 h-4" />
                                    }
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(n._id, "ngo")}
                                    disabled={actionLoading === n._id}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Verified NGOs Tab ── */}
              {activeTab === "verified-ngos" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {verifiedNgos.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <BadgeCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No verified NGOs yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            {["NGO Name", "Email", "Cause", "Darpan ID", "Location", "Verified On", "Actions"].map((h) => (
                              <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {verifiedNgos.map((n) => (
                            <tr key={n._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                    {n.logoUrl
                                      ? <img src={n.logoUrl} alt={n.name} className="w-full h-full object-cover" />
                                      : <span className="text-sm font-black text-primary">{(n.name || "N")[0].toUpperCase()}</span>
                                    }
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{n.name}</p>
                                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <p className="text-xs text-slate-400">{n.phone || "No phone"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{n.email}</td>
                              <td className="px-5 py-4">
                                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded capitalize">
                                  {n.cause?.replace(/-/g, " ") || "—"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm font-mono text-green-600 dark:text-green-400">
                                {n.darpanId || "—"}
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-500">
                                {[n.city, n.state].filter(Boolean).join(", ") || "—"}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-400">
                                {n.verifiedAt
                                  ? new Date(n.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "—"}
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => navigate(`/ngo/${n._id}`)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Reject Modal ─────────────────────────────────────── */}
      {rejectModal && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Reject {rejectModal.type === "campaign" ? "Campaign" : "NGO"}</h3>
            <p className="text-sm text-slate-400 mb-4">Please provide a reason so the {rejectModal.type === "campaign" ? "NGO" : "organization"} can reapply.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminVerificationPage;
