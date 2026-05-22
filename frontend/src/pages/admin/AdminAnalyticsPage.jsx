import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../contexts/useAuth";
import axios from "axios";
import {
    BarChart3, RefreshCw, Users, Database,
    TrendingUp, Megaphone, Target, PieChart, Info
} from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const BarChart = ({ data }) => {
    if (!data?.length) return (
        <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
            No data available
        </div>
    );
    const max = Math.max(...data.map((d) => d.amount), 1);
    return (
        <div>
            <div className="h-56 flex items-end gap-1.5">
                {data.map((d, i) => {
                    const h = Math.max((d.amount / max) * 100, 4);
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div
                                className="w-full bg-primary rounded-t-lg group-hover:opacity-80 transition-opacity"
                                style={{ height: `${h}%`, minHeight: "6px" }}
                            />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {d.label}: {d.amount}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-1.5 mt-2 overflow-hidden">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-slate-400 font-medium truncate">
                        {d.shortLabel || d.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminAnalyticsPage = () => {
    const { user, getToken, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user && user.role !== "admin") {
            navigate("/dashboard");
            return;
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, [user, isAuthenticated]);

    const fetchData = async (isBackground = false) => {
        if (!isAuthenticated || !user) return;

        if (!isBackground) setLoading(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const res = await axios.get(`${API}/admin/dashboard`, { headers });
            setStats(res.data.stats);
        } catch (err) {
            console.error("Failed to load analytics", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated || !user || user.role !== "admin") return null;

    if (loading || !stats) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-[500px]">
                <div className="text-center">
                    <RefreshCw className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Compiling Analytics Data...</p>
                </div>
            </div>
        );
    }

    // Derived dummy data for charts based on real totals to make it look nice
    // In a real scenario, this would come from a dedicated `/api/admin/analytics` backend route
    const campaignData = [
        { label: "Active", shortLabel: "Live", amount: stats.activeCampaigns },
        { label: "Pending", shortLabel: "Wait", amount: stats.pendingCampaigns },
        { label: "Total", shortLabel: "All", amount: stats.totalCampaigns },
    ];

    const userData = [
        { label: "NGOs", amount: stats.totalNGOs },
        { label: "Donors", amount: Math.max(0, stats.totalUsers - stats.totalNGOs - 1) }, // rough estimation
        { label: "Total", amount: stats.totalUsers },
    ];

    const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

    return (
        <div className="bg-slate-50 dark:bg-slate-950 py-8 min-h-screen font-display">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-primary" />
                            Platform Analytics
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Comprehensive overview of United Impact operations and metrics.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh Data
                        </button>
                    </div>
                </div>

                {/* Top-Level KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Platform Users</p>
                            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.totalUsers.toLocaleString()}</p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                            <Users className="w-32 h-32 -mr-6 -mb-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                                <Target className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Funds Raised</p>
                            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{fmtCurrency(stats.totalRaised)}</p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                            <TrendingUp className="w-32 h-32 -mr-6 -mb-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
                                <Megaphone className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Campaigns Running</p>
                            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.activeCampaigns}</p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                            <Megaphone className="w-32 h-32 -mr-6 -mb-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4">
                                <Database className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">NGO Verification Rate</p>
                            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                {stats.totalNGOs > 0 ? Math.round((stats.verifiedNGOs / stats.totalNGOs) * 100) : 0}%
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                            <PieChart className="w-32 h-32 -mr-6 -mb-6" />
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Campaign Distribution</h3>
                                <p className="text-sm text-slate-500">Status breakdown of all campaigns</p>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <PieChart className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <BarChart data={campaignData} />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">User Growth Summary</h3>
                                <p className="text-sm text-slate-500">Breakdown of registered roles</p>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <Users className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <BarChart data={userData} />
                    </div>

                </div>

                {/* Details Footer */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                        <Info className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">System Health & Operations</h4>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Currently processing {stats.totalDonations} total donations across {stats.totalCampaigns} campaigns.
                            {stats.pendingNGOs > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">Requires attention: {stats.pendingNGOs} NGO(s) waiting for verification.</span>}
                        </p>
                    </div>
                    <Link to="/admin/verification" className="shrink-0 px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-sm w-full md:w-auto text-center">
                        Review Approvals
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
