import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, RefreshCw, Loader2 } from "lucide-react";
import useAuth from "../../contexts/useAuth"; // ✅ Correct relative path
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const ActivityFeed = () => {
  const { getToken } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Wrap in useCallback so it can be safely used in useEffect
  const fetchRecent = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // ✅ Passed token in headers to fix the 403 Forbidden error
      const res = await axios.get(`${API}/donations/admin/recent?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(res.data);
    } catch (err) {
      console.error("Failed to fetch recent donations:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchRecent();
    
    intervalRef.current = setInterval(fetchRecent, 30000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchRecent]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Activity</h3>
        <button
          onClick={() => {
            setLoading(true);
            fetchRecent();
          }}
          className="text-slate-400 hover:text-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {loading && donations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : donations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No recent donations.</p>
        ) : (
          <div className="space-y-1">
            {donations.map((d, i) => (
              <div key={d._id || i} className="flex items-start gap-3 py-2.5">
                {/* Timeline dot */}
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  {i < donations.length - 1 && (
                    <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800 mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">
                      {d.isAnonymous ? "Anonymous" : d.donorName || "Someone"}
                    </span>{" "}
                    donated{" "}
                    <span className="font-semibold text-rose-500">₹{fmt(d.amount)}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {timeAgo(d.createdAt)}
                    {d.status && d.status !== "completed" && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/30 text-[10px] font-medium">
                        {d.status}
                      </span>
                    )}
                  </p>
                </div>

                <Heart className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
