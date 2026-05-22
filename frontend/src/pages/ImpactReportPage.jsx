import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../contexts/useAuth";
import axios from "axios";
import {
  Download, Share2, Heart, Users, DollarSign,
  CheckSquare, Rocket, ArrowLeft, MapPin,
  TrendingUp, Clock, Award, Loader2, AlertCircle,
  Megaphone, BarChart2
} from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Donut Chart ───────────────────────────────────────────────
const DonutChart = ({ financials }) => {
  const r = 100, cx = 128, cy = 128;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="256" height="256" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="40" />
        {financials.map((f, i) => {
          const dash = (f.pct / 100) * circ;
          const seg = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="transparent"
              stroke={f.color} strokeWidth="40"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">100%</span>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Allocated</span>
      </div>
    </div>
  );
};

// ─── Monthly Bar Chart ─────────────────────────────────────────
const MonthlyBarChart = ({ data }) => {
  if (!data?.length) return (
    <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
      No donation history yet
    </div>
  );
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div>
      <div className="h-48 flex items-end gap-1.5">
        {data.map((d, i) => {
          const h = Math.max((d.amount / max) * 100, 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-primary rounded-t-lg group-hover:opacity-80 transition-opacity"
                style={{ height: `${h}%`, minHeight: "6px" }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                ₹{fmt(d.amount)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 font-medium">
            {months[(d.month - 1)]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Campaign Selector ─────────────────────────────────────────
const CampaignSelector = ({ campaigns, selectedId, onSelect }) => (
  <div className="no-print mb-8 flex flex-wrap gap-3">
    {campaigns.map((c) => (
      <button
        key={c._id}
        onClick={() => onSelect(c._id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all
          ${selectedId === c._id
            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40"
          }`}
      >
        {c.imageUrl && (
          <img src={c.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
        )}
        {c.title}
      </button>
    ))}
  </div>
);

// ─── Section filter tabs ───────────────────────────────────────
const SECTIONS = [
  { id: "all", label: "Full Report" },
  { id: "summary", label: "Summary" },
  { id: "financials", label: "Financials" },
  { id: "timeline", label: "Timeline" },
];

// ─── Main Component ────────────────────────────────────────────
const ImpactReportPage = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("all");

  // ── 1. Load campaign list ──
  useEffect(() => {
    if (!user) return;
    const load = async (isBackground = false) => {
      if (!isBackground) setLoadingList(true);
      try {
        const token = await getToken();
        const res = await axios.get(`${API}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setCampaigns(list);
        if (list.length > 0) setSelectedId(list[0]._id);
      } catch (err) {
        setError("Failed to load your campaigns.");
      } finally {
        setLoadingList(false);
      }
    };
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ── 2. Load report when campaign selected ──
  useEffect(() => {
    if (!selectedId || !user) return;
    const load = async (isBackground = false) => {
      if (!isBackground) setLoadingReport(true);
      setError("");
      try {
        const token = await getToken();
        const res = await axios.get(`${API}/reports/${selectedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReport(res.data);
      } catch (err) {
        setError("Failed to load report data.");
        setReport(null);
      } finally {
        setLoadingReport(false);
      }
    };
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [selectedId, user]);

  const handlePrint = () => window.print();

  const handleShare = () => {
    const url = `${window.location.origin}/reports/${selectedId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const donorName = user
    ? `${user.firstName || user.name || ""} ${user.lastName || ""}`.trim() || "Donor"
    : "Donor";

  // ── Empty state — no donations yet ──
  if (!loadingList && campaigns.length === 0) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 font-display">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart2 className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            No Impact Reports Yet
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {user?.role === "ngo"
              ? "Your campaigns will appear here once they receive donations."
              : "Make your first donation to a campaign to see your personalised impact report."}
          </p>
        </div>
        <button
          onClick={() => navigate("/campaigns")}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-blue-600 transition-colors"
        >
          <Megaphone className="w-4 h-4" />
          {user?.role === "ngo" ? "View My Campaigns" : "Explore Campaigns"}
        </button>
        <button onClick={() => navigate("/dashboard")} className="text-slate-400 text-sm hover:text-primary transition-colors">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-display text-slate-800 dark:text-slate-200 transition-colors">

      {/* ── Fixed Action Bar ── */}
      <div className="no-print fixed top-6 right-6 z-50 flex flex-col gap-3">
        <button
          onClick={handlePrint}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-xl transition-all flex items-center gap-2 text-sm font-semibold"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
        <button
          onClick={handleShare}
          className="bg-white dark:bg-slate-800 text-primary px-4 py-2.5 rounded-full shadow-xl transition-all flex items-center gap-2 text-sm font-semibold border border-primary/20"
        >
          <Share2 className="w-4 h-4" />
          {copied ? "Link Copied!" : "Share Link"}
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-full shadow-xl transition-all flex items-center gap-2 text-sm font-semibold border border-slate-200 dark:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
      </div>

      <main className="max-w-[1000px] mx-auto py-12 px-4 md:px-6" ref={reportRef}>

        {/* Loading list */}
        {loadingList && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {!loadingList && (
          <>
            {/* Campaign selector */}
            <CampaignSelector
              campaigns={campaigns}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            {/* Section tabs */}
            <div className="no-print mb-8 flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${activeSection === s.id
                      ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-8 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Report loading spinner */}
            {loadingReport && (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}

            {/* ══════════ REPORT CONTENT ══════════ */}
            {!loadingReport && report && (
              <>

                {/* ════ COVER PAGE ════ */}
                {(activeSection === "all" || activeSection === "summary") && (
                  <section className="report-page relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden mb-12 min-h-[700px] flex flex-col">
                    <div className="relative h-[500px] w-full">
                      {report.campaign.imageUrl ? (
                        <img
                          src={report.campaign.imageUrl}
                          alt={report.campaign.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                          <Megaphone className="w-24 h-24 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                      {/* Logo */}
                      <div className="absolute top-8 left-8 flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold text-sm">UI</div>
                        <span className="text-white font-bold text-xl tracking-tight">United Impact</span>
                      </div>

                      <div className="absolute bottom-12 left-12 right-12">
                        <span className="text-emerald-400 font-bold tracking-widest uppercase text-xs bg-emerald-400/10 px-3 py-1 rounded-full mb-4 inline-flex items-center gap-1">
                          <Award className="w-3 h-3" /> {report.period} Annual Report
                        </span>
                        <h1 className="text-white text-5xl font-extrabold mb-3 leading-tight mt-3">
                          Impact Report
                        </h1>
                        <div className="h-1 w-20 bg-primary mb-5" />
                        <p className="text-slate-300 text-xl font-light">
                          {report.campaign.title}
                        </p>
                        {report.ngo.isVerified && (
                          <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                            ✓ Verified NGO — {report.ngo.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-12 flex-grow flex flex-col justify-end">
                      <div className="flex justify-between items-end flex-wrap gap-4">
                        <div>
                          <p className="text-slate-400 uppercase tracking-widest text-xs mb-1">Prepared for</p>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{donorName}</h2>
                          {report.myImpact.donorSince && (
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Donor since {report.myImpact.donorSince}
                              {report.myImpact.totalDonated > 0 && (
                                <> · Contributed ₹{fmt(report.myImpact.totalDonated)}</>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Issued on {report.issuedDate}</p>
                          <p className="text-primary font-medium text-sm">Ref: {report.reportId}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* ════ EXECUTIVE SUMMARY ════ */}
                {(activeSection === "all" || activeSection === "summary") && (
                  <section className="report-page bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden mb-12 p-12">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Heart className="w-7 h-7" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                          A Heartfelt Thank You
                        </h2>
                      </div>

                      <div className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10 space-y-4 text-base">
                        <p>Dear {donorName},</p>
                        <p>
                          Your support for <strong className="text-slate-800 dark:text-white">{report.campaign.title}</strong> has
                          made a measurable difference. This report shows exactly where your contribution went
                          and the lives it has touched.
                        </p>
                        {report.campaign.description && (
                          <p className="text-slate-500">{report.campaign.description}</p>
                        )}
                        <blockquote className="border-l-4 border-primary pl-4 italic text-slate-500 my-6">
                          "True impact is not measured by the wealth we accumulate, but by the lives we empower.
                          Your contribution has built a legacy of health and hope."
                        </blockquote>
                        <div className="flex items-center gap-4 mt-6">
                          {report.ngo.directorAvatar ? (
                            <img
                              src={report.ngo.directorAvatar}
                              alt={report.ngo.directorName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
                              {report.ngo.directorName?.[0] || "N"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{report.ngo.directorName}</p>
                            <p className="text-sm text-slate-500">{report.ngo.name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-5 mt-10">
                        <div className="bg-primary/5 dark:bg-primary/10 p-7 rounded-xl border border-primary/10">
                          <Users className="w-8 h-8 text-primary mb-3" />
                          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                            {report.metrics.livesImpacted > 0
                              ? `${fmt(report.metrics.livesImpacted)}+`
                              : "—"}
                          </div>
                          <div className="text-slate-500 font-medium text-sm">Lives Impacted (est.)</div>
                        </div>

                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-7 rounded-xl border border-emerald-500/10">
                          <DollarSign className="w-8 h-8 text-emerald-500 mb-3" />
                          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                            ₹{fmt(report.metrics.totalRaised)}
                          </div>
                          <div className="text-slate-500 font-medium text-sm">Total Raised</div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800 p-7 rounded-xl">
                          <Users className="w-8 h-8 text-slate-500 mb-3" />
                          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                            {fmt(report.metrics.volunteersEngaged)}
                          </div>
                          <div className="text-slate-500 font-medium text-sm">Volunteers Engaged</div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800 p-7 rounded-xl">
                          <div className="flex justify-between items-start mb-3">
                            <CheckSquare className="w-8 h-8 text-slate-500" />
                            <span className="text-xl font-bold text-emerald-500">
                              {report.metrics.completionRate}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-2">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                              style={{ width: `${report.metrics.completionRate}%` }}
                            />
                          </div>
                          <div className="text-slate-500 font-medium text-sm">Funding Progress</div>
                        </div>
                      </div>

                      {/* Donor personal impact */}
                      {report.myImpact.totalDonated > 0 && user?.role !== "admin" && (
                        <div className="mt-10 p-6 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h4 className="font-bold text-slate-800 dark:text-white">Your Personal Impact</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-extrabold text-primary">
                                ₹{fmt(report.myImpact.totalDonated)}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">Your Contribution</p>
                            </div>
                            <div>
                              <p className="text-2xl font-extrabold text-emerald-500">
                                ~{fmt(report.myImpact.livesReached)}+
                              </p>
                              <p className="text-xs text-slate-500 mt-1">Lives Reached (est.)</p>
                            </div>
                            <div>
                              <p className="text-2xl font-extrabold text-slate-800 dark:text-white capitalize">
                                {user?.role || "Donor"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">Your Role</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ════ FINANCIALS ════ */}
                {(activeSection === "all" || activeSection === "financials") && (
                  <section className="report-page bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden mb-12 p-12">

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                      <span className="w-7 h-7 bg-primary text-white rounded flex items-center justify-center text-xs font-bold">01</span>
                      Financial Transparency
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-14">
                      <DonutChart financials={report.financials} />
                      <div className="space-y-5">
                        {report.financials.map((f) => (
                          <div key={f.label} className="flex items-start gap-4">
                            <div className="w-4 h-4 rounded mt-0.5 shrink-0" style={{ backgroundColor: f.color }} />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{f.label}</span>
                                <span className="font-bold text-sm" style={{ color: f.color }}>{f.pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-1.5">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${f.pct}%`, backgroundColor: f.color }}
                                />
                              </div>
                              <div className="flex justify-between">
                                <p className="text-xs text-slate-500">{f.desc}</p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 ml-2">
                                  ₹{fmt(f.amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly donations chart */}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                      <span className="w-7 h-7 bg-primary text-white rounded flex items-center justify-center text-xs font-bold">02</span>
                      Monthly Donation Trend
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                      <MonthlyBarChart data={report.monthlyChart} />
                    </div>

                    {/* Donor count */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Donors</p>
                        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{fmt(report.metrics.donorCount)}</p>
                      </div>
                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Goal Amount</p>
                        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">₹{fmt(report.metrics.goalAmount)}</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ════ TIMELINE & FUTURE ════ */}
                {(activeSection === "all" || activeSection === "timeline") && (
                  <section className="report-page bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden mb-12 flex flex-col">
                    <div className="p-12 flex-grow">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-10 flex items-center gap-3">
                        <span className="w-7 h-7 bg-primary text-white rounded flex items-center justify-center text-xs font-bold">03</span>
                        Campaign Timeline
                      </h3>

                      <div className="relative py-4">
                        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-slate-100 dark:bg-slate-800 rounded-full" />

                        {/* Start */}
                        <div className="relative pl-12 mb-10">
                          <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-primary" />
                          <span className="text-xs font-bold uppercase tracking-widest text-primary">
                            Campaign Launch
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            {report.campaign.title} Begins
                          </h4>
                          <p className="text-slate-500 text-sm mt-1">
                            {report.campaign.startDate
                              ? new Date(report.campaign.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                              : new Date(report.campaign.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>

                        {/* Milestone: 50% */}
                        {report.metrics.completionRate >= 50 && (
                          <div className="relative pl-12 mb-10">
                            <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                              Milestone
                            </span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                              50% Funding Goal Reached
                            </h4>
                            <p className="text-slate-500 text-sm mt-1">
                              ₹{fmt(Math.round(report.metrics.goalAmount * 0.5))} raised from {fmt(report.metrics.donorCount)} donors.
                            </p>
                          </div>
                        )}

                        {/* Current status */}
                        <div className="relative pl-12 mb-10">
                          <div className={`absolute left-1.5 top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900
                            ${report.campaign.status === "completed" ? "bg-purple-500" : "bg-amber-500"}`}
                          />
                          <span className={`text-xs font-bold uppercase tracking-widest
                            ${report.campaign.status === "completed" ? "text-purple-500" : "text-amber-500"}`}>
                            {report.campaign.status === "completed" ? "Completed" : "Active"}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            {report.campaign.status === "completed"
                              ? "Campaign Successfully Completed"
                              : "Campaign Currently Active"}
                          </h4>
                          <p className="text-slate-500 text-sm mt-1">
                            {report.metrics.completionRate}% of goal reached · ₹{fmt(report.metrics.totalRaised)} total raised.
                          </p>
                        </div>

                        {/* End date */}
                        {report.campaign.endDate && (
                          <div className="relative pl-12">
                            <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                              Target End Date
                            </span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                              Campaign Deadline
                            </h4>
                            <p className="text-slate-500 text-sm mt-1">
                              {new Date(report.campaign.endDate).toLocaleDateString("en-IN", {
                                day: "numeric", month: "long", year: "numeric"
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 2025 Vision box */}
                      <div className="mt-10 p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-5">
                          <Rocket className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">What's Next</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-sm">
                          {report.campaign.status === "completed"
                            ? `The ${report.campaign.title} campaign has concluded. The NGO continues to expand impact through new initiatives.`
                            : `The ${report.campaign.title} campaign is ongoing. Every contribution brings the goal closer. Join thousands of donors making a difference.`}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-primary font-bold text-sm block mb-1">Remaining Goal</span>
                            <p className="text-xs text-slate-500">
                              ₹{fmt(Math.max(0, report.metrics.goalAmount - report.metrics.totalRaised))} still needed
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-emerald-500 font-bold text-sm block mb-1">Category</span>
                            <p className="text-xs text-slate-500 capitalize">
                              {report.campaign.category?.replace("-", " ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Footer */}
                    <div className="bg-slate-900 dark:bg-black p-14 text-center text-white">
                      <h2 className="text-3xl font-extrabold mb-3">Continue Your Impact</h2>
                      <p className="text-slate-400 mb-8 max-w-lg mx-auto text-sm">
                        Your partnership is the engine of change. Join us for the next chapter.
                      </p>
                      <div className="flex justify-center gap-4 mb-12 flex-wrap">
                        <button
                          onClick={() => navigate(`/donate/${report.campaign._id}`)}
                          className="bg-primary hover:bg-blue-600 text-white px-7 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 text-sm"
                        >
                          Donate Again
                        </button>
                        <button
                          onClick={() => navigate("/campaigns")}
                          className="bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 rounded-full font-bold transition-all text-sm"
                        >
                          Explore Campaigns
                        </button>
                      </div>

                      <hr className="border-white/10 mb-8" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left text-xs text-slate-500 uppercase tracking-widest mb-8">
                        <div>
                          <p className="font-bold text-slate-300 mb-2">{report.ngo.name}</p>
                          {report.ngo.city && <p>{report.ngo.city}</p>}
                          <p>United Impact Platform</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-300 mb-2">Contact Details</p>
                          <p>impact@unitedimpact.org</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-300 mb-2">Report Reference</p>
                          <p>{report.reportId}</p>
                          <p>Issued {report.issuedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 opacity-40">
                        <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">UI</span>
                        </div>
                        <span className="text-[10px] font-bold">POWERED BY UNITED IMPACT PLATFORM</span>
                      </div>
                    </div>
                  </section>
                )}

                <div className="no-print mb-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{report.ngo.city || "India"} · {report.ngo.name}</span>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ImpactReportPage;
