import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Users, Calendar, Share2, Heart, Star,
  StarHalf, Verified, ChevronRight, Facebook, Twitter, Clock,
  Eye, TrendingUp, Loader2, MessageSquare
} from "lucide-react";
import useAuth from "../contexts/useAuth";
import axios from "axios";
import IndiaMap from "../components/IndiaMap";


const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const pct = (cur, tar) => Math.min(Math.round((cur / tar) * 100), 100);
const daysLeft = (end) => {
  const d = Math.ceil((new Date(end) - Date.now()) / 86400000);
  return d > 0 ? d : 0;
};
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const CircleProgress = ({ value }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke="#3c83f6" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-white">
        {value}%
      </div>
    </div>
  );
};

const StarRating = ({ rating = 5 }) => (
  <div className="flex items-center gap-0.5 text-yellow-400">
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.floor(rating) ? (
        <Star key={i} className="w-4 h-4 fill-current" />
      ) : i - 0.5 <= rating ? (
        <StarHalf key={i} className="w-4 h-4 fill-current" />
      ) : (
        <Star key={i} className="w-4 h-4 text-slate-200" />
      )
    )}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
      ${active
        ? "border-primary text-primary"
        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
      }`}
  >
    {label}
  </button>
);

const VolunteerModal = ({ campaign, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({ role: "", hoursCommitted: "", message: "" });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-1">Volunteer for this Campaign</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          {campaign?.title}
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Your Role / Skills
            </label>
            <input
              type="text"
              placeholder="e.g. Teacher, IT support, Coordinator"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Hours you can commit per week
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={form.hoursCommitted}
              onChange={(e) => setForm((p) => ({ ...p, hoursCommitted: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Message to the NGO (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Tell them why you'd like to volunteer..."
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading || !form.role}
            onClick={() => onSubmit(form)}
            className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({ url, title, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold mb-4">Share this Campaign</h3>
        <div className="flex gap-3 mb-5">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Facebook className="w-4 h-4" /> Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors"
          >
            <Twitter className="w-4 h-4" /> Twitter
          </a>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 outline-none"
          />
          <button
            onClick={copy}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${copied ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-blue-600"}`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, getToken } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showVolModal, setShowVolModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [volLoading, setVolLoading] = useState(false);
  const [volSuccess, setVolSuccess] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/campaigns/${id}`);
        setCampaign(res.data.campaign);
        setDonations(res.data.donations || []);
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError("Failed to fetch campaign details. It might have been deleted.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCampaign();
  }, [id]);

  const handleVolunteer = async (form) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setVolLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${API}/campaigns/${id}/volunteer`, {
        role: form.role,
        message: form.message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVolSuccess(true);
      setShowVolModal(false);
      showToast("✅ Volunteer request sent! The NGO will review your application.");
    } catch (err) {
      console.error(err);
      showToast("Failed to send volunteer request.");
    } finally {
      setVolLoading(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm">Loading campaign...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center space-y-4">
        <p className="text-red-500 font-semibold text-lg">{error}</p>
        <button onClick={() => navigate("/campaigns")} className="text-primary hover:underline text-sm">
          ← Back to Campaigns
        </button>
      </div>
    </div>
  );

  if (!campaign) return null;

  const ngo = typeof campaign.ngoId === "object" ? campaign.ngoId : null;
  const ngoId = ngo?._id || campaign.ngoId;
  const ngoName = ngo?.name || ngo?.organizationName || ngo?.firstName || "Unknown NGO";
  const ngoVerified = ngo?.isVerified || ngo?.status === "approved";
  const ngoCity = ngo?.city || campaign.location?.city;
  const ngoState = ngo?.state || campaign.location?.state;

  const progress = pct(campaign.currentAmount, campaign.goalAmount || campaign.targetAmount);
  const days = daysLeft(campaign.endDate);
  const donorCount = donations.length;
  const volCount = campaign.volunteers?.filter(v => v.status === "approved").length || 0;

  const primaryImg = campaign.images?.find(i => i.isPrimary)?.url
    || campaign.images?.[0]?.url
    || campaign.imageUrl;
  const allImages = campaign.images || (campaign.imageUrl ? [{ url: campaign.imageUrl, isPrimary: true }] : []);

  const shareUrl = window.location.href;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3 bg-slate-900 text-white rounded-xl shadow-2xl text-sm font-medium animate-bounce">
          {toast}
        </div>
      )}

      {showVolModal && (
        <VolunteerModal
          campaign={campaign}
          onClose={() => setShowVolModal(false)}
          onSubmit={handleVolunteer}
          loading={volLoading}
        />
      )}

      {showShare && (
        <ShareModal
          url={shareUrl}
          title={campaign.title}
          onClose={() => setShowShare(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={() => navigate(`/donate/${id}`)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          Donate Now
        </button>
      </div>

      {/* Hero section */}
      <section className="relative h-[420px] md:h-[480px] overflow-hidden">
        {primaryImg ? (
          <img src={primaryImg} alt={campaign.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-emerald-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-10">
          <nav className="flex items-center gap-1.5 text-white/60 text-xs mb-4">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/campaigns" className="hover:text-white">Campaigns</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80 truncate max-w-xs">{campaign.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
              {campaign.category?.replace(/-/g, " ")}
            </span>
            {campaign.approvalStatus === "approved" && ngoVerified && (
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white">
                <Verified className="w-3 h-3 text-blue-400" /> Verified NGO
              </div>
            )}
            {campaign.isUrgent && (
              <span className="bg-red-500 px-3 py-1 rounded-full text-xs font-bold text-white uppercase">
                Urgent
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white max-w-3xl leading-tight mb-5">
            {campaign.title}
          </h1>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/30 border-2 border-white/20 flex items-center justify-center text-white font-bold text-sm">
              {ngoName[0]?.toUpperCase() || "N"}
            </div>
            <div>
              <p className="text-white font-medium text-sm flex items-center gap-1.5">
                {ngoName}
                {ngoVerified && <Verified className="w-3.5 h-3.5 text-blue-400" />}
              </p>
              <p className="text-white/60 text-xs flex items-center gap-1">
                {ngoCity && (
                  <>
                    <MapPin className="w-3 h-3" />
                    {ngoCity}{ngoState && `, ${ngoState}`}
                    {" • "}
                  </>
                )}
                <Calendar className="w-3 h-3" />
                Since {fmtDate(campaign.startDate || campaign.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="border-b border-slate-200 dark:border-slate-800 mb-8 sticky top-0 bg-background-light dark:bg-background-dark z-10 pt-2">
              <div className="flex gap-6 overflow-x-auto no-scrollbar">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "updates", label: `Updates (${donations.length || 0})` },
                  { key: "gallery", label: `Gallery (${allImages.length})` },
                  { key: "comments", label: `Comments (${campaign.comments?.length || 0})` },
                ].map(({ key, label }) => (
                  <Tab key={key} label={label} active={activeTab === key} onClick={() => setActiveTab(key)} />
                ))}
              </div>
            </div>

            {activeTab === "overview" && (
              <div className="space-y-10">
                <section>
                  <h2 className="text-2xl font-bold mb-4">About this Campaign</h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base whitespace-pre-line">
                    {campaign.description}
                  </p>
                </section>

                {campaign.budgetBreakdown?.length > 0 && (
                  <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" /> Budget Breakdown
                    </h3>
                    <div className="space-y-3">
                      {campaign.budgetBreakdown.map((b, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{b.category}</span>
                              <span className="text-slate-500">₹{fmt(b.amount)} ({b.percentage}%)</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${b.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {campaign.beneficiaries && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">Impact Goals</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      {campaign.beneficiaries.targetCount && (
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                          <p className="text-primary font-bold text-3xl">{fmt(campaign.beneficiaries.targetCount)}</p>
                          <p className="text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold mt-1">
                            Beneficiaries
                          </p>
                        </div>
                      )}
                      {campaign.milestones?.length > 0 && (
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                          <p className="text-primary font-bold text-3xl">{campaign.milestones.length}</p>
                          <p className="text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold mt-1">
                            Milestones
                          </p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                        <p className="text-primary font-bold text-3xl">{donorCount}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold mt-1">
                          Donors
                        </p>
                      </div>
                    </div>
                    {campaign.beneficiaries.description && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {campaign.beneficiaries.description}
                      </p>
                    )}
                  </section>
                )}

                {/* ✅ LOCATION SECTION WITH GOOGLE MAPS EMBED */}
                {(campaign.location?.city || campaign.location?.coordinates?.latitude) && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">Location</h2>
                    <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative">
                      {campaign.location?.coordinates?.latitude ? (
                        <IndiaMap
                          markers={[{
                            lat: campaign.location.coordinates.latitude,
                            lng: campaign.location.coordinates.longitude,
                            title: campaign.title,
                            type: 'campaign'
                          }]}
                          height="100%"
                          zoom={14}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full gap-2 text-slate-400">
                          <MapPin className="w-5 h-5" />
                          <span className="font-medium">
                            {campaign.location.city}, {campaign.location.state}, {campaign.location.country}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "updates" && (
              <div className="space-y-6">
                {donations.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-medium">No updates yet</p>
                    <p className="text-sm">We are waiting for the first supporters.</p>
                  </div>
                ) : (
                  donations.map((d, i) => (
                    <div key={d._id || i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {donations.length - i}
                        </div>
                        {i < donations.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-2" />
                        )}
                      </div>
                      <div className="pb-8 flex-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          {fmtDate(d.createdAt)}
                        </span>
                        <h4 className="font-bold text-base mt-0.5 mb-2">New Donation Received!</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                          {d.donorName || "An anonymous donor"} has generously contributed ₹{fmt(d.amount)} to this campaign.
                          {d.message && <span className="block mt-2 italic text-slate-500">"{d.message}"</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "gallery" && (
              <div>
                {allImages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Eye className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-medium">No images uploaded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allImages.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 group">
                        <img
                          src={img.url || img}
                          alt={img.alt || `Image ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {img.isPrimary && (
                          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-5">
                {campaign.comments?.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p className="font-medium">No comments yet</p>
                    <p className="text-sm">Be the first to leave a comment!</p>
                  </div>
                ) : (
                  campaign.comments?.map((c, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          U
                        </div>
                        <span className="text-sm font-semibold">User</span>
                        <span className="text-xs text-slate-400 ml-auto">{fmtDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 space-y-5">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-2xl font-bold">₹{fmt(campaign.currentAmount)}</h3>
                    <p className="text-slate-500 text-sm">raised of ₹{fmt(campaign.goalAmount || campaign.targetAmount)} goal</p>
                  </div>
                  <CircleProgress value={progress} />
                </div>

                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: "Donors", value: donorCount },
                    { label: "Days Left", value: days },
                    { label: "Volunteers", value: volCount },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs font-semibold text-slate-400 uppercase">{label}</p>
                      <p className="font-bold text-base">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/donate/${id}`)}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                  >
                    <Heart className="w-5 h-5" /> Donate Now
                  </button>
                  <button
                    onClick={() => isAuthenticated ? setShowVolModal(true) : navigate("/login")}
                    disabled={volSuccess}
                    className="w-full py-3.5 bg-primary hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:dark:bg-slate-800 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Users className="w-5 h-5" />
                    {volSuccess ? "✓ Request Sent" : "Volunteer"}
                  </button>
                  {/* Message NGO Button */}
                  <button
                    onClick={() => navigate(`/messages?to=${ngoId}`)}
                    className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message NGO
                  </button>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-center text-sm font-medium text-slate-500 mb-3">Share this campaign</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setShowShare(true)}
                      className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* NGO card */}
              <div className="bg-slate-900 text-white p-5 rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center font-bold">
                      {ngoName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight flex items-center gap-1.5">
                        {ngoName}
                        {ngoVerified && <Verified className="w-3 h-3 text-blue-400" />}
                      </p>
                      <p className="text-[11px] text-white/50">
                        {ngoVerified ? "Verified NGO" : "Pending Verification"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed mb-4">
                    {campaign.shortDescription || campaign.description?.substring(0, 100)}...
                  </p>
                  <button
                    onClick={() => navigate(`/ngo/${ngoId}`)}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
                  >
                    View NGO Profile
                  </button>
                </div>
                <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetailPage;
