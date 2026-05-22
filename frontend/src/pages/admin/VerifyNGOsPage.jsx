import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, Building2, Mail, Phone, MapPin, CheckCircle2,
  XCircle, Loader2, ArrowLeft, AlertTriangle,
} from "lucide-react";
import useAuth from "../../contexts/useAuth";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const VerifyNGOsPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // ngoId being acted on

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API}/users/admin/pending-ngos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNgos(res.data);
      } catch (err) {
        console.error("Failed to fetch pending NGOs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [getToken]);

  const handleAction = async (ngoId, action) => {
    setActionLoading(ngoId);
    try {
      const token = await getToken();
      await axios.post(
        `${API}/users/admin/verify-ngo`,
        { ngoId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNgos((prev) => prev.filter((n) => n._id !== ngoId));
    } catch (err) {
      console.error(`Failed to ${action} NGO:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">NGO Verification</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {ngos.length} pending {ngos.length === 1 ? "request" : "requests"}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && ngos.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-sm text-slate-500 mt-1">No pending NGO verification requests.</p>
          </div>
        )}

        {/* NGO Cards */}
        <div className="space-y-4">
          {ngos.map((ngo) => (
            <div
              key={ngo._id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {ngo.organizationName || ngo.name}
                      </h3>
                      <p className="text-xs text-slate-500">{ngo.name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> {ngo.email}
                    </span>
                    {ngo.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" /> {ngo.phone}
                      </span>
                    )}
                    {ngo.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {ngo.city}
                      </span>
                    )}
                  </div>

                  {ngo.darpanId && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Darpan ID:</span> {ngo.darpanId}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(ngo._id, "approve")}
                    disabled={actionLoading === ngo._id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === ngo._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(ngo._id, "reject")}
                    disabled={actionLoading === ngo._id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VerifyNGOsPage;
