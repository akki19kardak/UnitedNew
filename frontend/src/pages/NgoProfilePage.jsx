import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin, Mail, Phone, Globe, Verified, Loader2,
  Building2, FileText, Heart, ExternalLink,
  BadgeCheck, ShieldCheck, Calendar, Users,
  IndianRupee, ChevronRight,
} from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const CAUSE_COLORS = {
  education:           { bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-blue-600 dark:text-blue-400",   dot: "bg-blue-500"   },
  health:              { bg: "bg-red-50 dark:bg-red-900/20",     text: "text-red-600 dark:text-red-400",     dot: "bg-red-500"    },
  environment:         { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", dot: "bg-green-500"  },
  "women-empowerment": { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600",                  dot: "bg-purple-500" },
  "child-welfare":     { bg: "bg-pink-50 dark:bg-pink-900/20",   text: "text-pink-600",                      dot: "bg-pink-500"   },
  "animal-welfare":    { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600",                  dot: "bg-orange-500" },
  "disaster-relief":   { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600",                    dot: "bg-amber-500"  },
  other:               { bg: "bg-slate-100 dark:bg-slate-800",   text: "text-slate-600",                    dot: "bg-slate-400"  },
};

const ProgressBar = ({ current, target }) => {
  const pct = Math.min(Math.round((Number(current) / (Number(target) || 1)) * 100), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-bold text-slate-900 dark:text-white">₹{fmt(current)}</span>
        <span className="text-slate-400">₹{fmt(target)}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-slate-400 text-right">{pct}% funded</div>
    </div>
  );
};

const NgoProfilePage = () => {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [ngo, setNgo]             = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        // Fetch NGO — works with both MongoDB _id AND firebaseUid
        const res = await axios.get(`${API}/ngos/${id}`);
        setNgo(res.data);

        // Fetch this NGO's approved campaigns
        const campRes = await axios.get(`${API}/campaigns?ngoId=${id}`);
        const list = Array.isArray(campRes.data)
          ? campRes.data
          : campRes.data.campaigns || campRes.data.data || [];
        setCampaigns(list);
      } catch (err) {
        console.error("NGO profile load error:", err);
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-slate-500">Loading NGO profile...</p>
      </div>
    </div>
  );

  // ── Not Found ───────────────────────────────────────────────
  if (notFound || !ngo) return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm px-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">NGO Not Found</h2>
        <p className="text-sm text-slate-400">
          This NGO profile doesn't exist or may have been removed.
        </p>
        <button
          onClick={() => navigate("/campaigns")}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
        >
          Browse Campaigns
        </button>
      </div>
    </div>
  );

  const causeStyle = CAUSE_COLORS[ngo.cause] || CAUSE_COLORS.other;
  const initials   = (ngo.name || ngo.organizationName || "N")[0].toUpperCase();
  const totalRaised = campaigns.reduce((s, c) => s + (c.currentAmount || 0), 0);
  const joinedYear  = ngo.createdAt ? new Date(ngo.createdAt).getFullYear() : null;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-display text-slate-800 dark:text-slate-200">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative">
        {/* Cover image or gradient */}
        <div className="h-56 md:h-72 w-full overflow-hidden">
          {ngo.bannerUrl ? (
            <img src={ngo.bannerUrl} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-blue-500 to-emerald-500 opacity-80" />
          )}
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Profile section */}
        <div className="max-w-6xl mx-auto px-4 relative -mt-16 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">

            {/* Logo / Avatar */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 overflow-hidden shadow-xl flex items-center justify-center shrink-0">
              {ngo.logoUrl ? (
                <img src={ngo.logoUrl} alt={ngo.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-primary">{initials}</span>
              )}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow">
                  {ngo.name || ngo.organizationName}
                </h1>
                {ngo.isVerified && (
                  <span className="flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>

              {/* Cause tag + location */}
              <div className="flex flex-wrap items-center gap-2">
                {ngo.cause && (
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${causeStyle.bg} ${causeStyle.text}`}>
                    <span className={`w-2 h-2 rounded-full ${causeStyle.dot}`} />
                    {ngo.cause.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                )}
                {ngo.city && (
                  <span className="flex items-center gap-1 text-xs text-white/80">
                    <MapPin className="w-3 h-3" />
                    {ngo.city}{ngo.state ? `, ${ngo.state}` : ""}
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate(`/messages?to=${ngo.firebaseUid}`)}
                className="px-5 py-2.5 bg-white/90 dark:bg-slate-800 hover:bg-white text-slate-900 dark:text-white rounded-xl font-semibold text-sm transition-colors shadow"
              >
                Contact
              </button>
              {campaigns.length > 0 && (
                <button
                  onClick={() => document.getElementById("campaigns-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="px-5 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-colors shadow"
                >
                  Donate Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — main content */}
          <div className="lg:col-span-2 space-y-10">

            {/* About */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                About Us
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                {ngo.description || "This NGO hasn't added a description yet."}
              </p>
            </section>

            {/* Verification Badges */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Trust & Verification
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* NGO Darpan */}
                <div className={`flex items-start gap-4 p-4 rounded-xl border ${
                  ngo.darpanId
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60"
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ngo.darpanId ? "bg-green-100 dark:bg-green-800" : "bg-slate-100 dark:bg-slate-700"
                  }`}>
                    <ShieldCheck className={`w-5 h-5 ${ngo.darpanId ? "text-green-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">NGO Darpan Registered</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ngo.darpanId ? (
                        <span className="font-mono text-green-600 dark:text-green-400">{ngo.darpanId}</span>
                      ) : "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Platform Verified */}
                <div className={`flex items-start gap-4 p-4 rounded-xl border ${
                  ngo.isVerified
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60"
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ngo.isVerified ? "bg-blue-100 dark:bg-blue-800" : "bg-slate-100 dark:bg-slate-700"
                  }`}>
                    <BadgeCheck className={`w-5 h-5 ${ngo.isVerified ? "text-blue-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">UnitedImpact Verified</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ngo.isVerified
                        ? ngo.verifiedAt
                          ? `Verified on ${new Date(ngo.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                          : "Verified by admin"
                        : "Pending verification"}
                    </p>
                  </div>
                </div>

                {/* 80G Tax Exemption placeholder */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">80G Tax Exemption</p>
                    <p className="text-xs text-slate-500 mt-0.5">Not submitted yet</p>
                  </div>
                </div>

                {/* FCRA placeholder */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Verified className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">FCRA Registration</p>
                    <p className="text-xs text-slate-500 mt-0.5">Not submitted yet</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Campaigns */}
            <section id="campaigns-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  Active Campaigns
                  <span className="text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {campaigns.length}
                  </span>
                </h2>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-medium text-slate-400">No active campaigns yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {campaigns.map((c) => {
                    const primaryImage =
                      c.imageUrl ||
                      c.images?.find((i) => i.isPrimary)?.url ||
                      c.images?.[0]?.url;

                    return (
                      <div
                        key={c._id}
                        onClick={() => navigate(`/campaigns/${c._id}`)}
                        className="group border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden
                                   hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-slate-900"
                      >
                        {/* Image */}
                        <div className="h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                          {primaryImage ? (
                            <img src={primaryImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                              <FileText className="w-8 h-8" />
                            </div>
                          )}
                          {c.isUrgent && (
                            <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              Urgent
                            </span>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {c.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                            {c.shortDescription || c.description}
                          </p>
                          <ProgressBar
                            current={c.currentAmount || 0}
                            target={c.goalAmount || c.targetAmount || 1}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/donate/${c._id}`); }}
                            className="w-full mt-3 py-2 bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold rounded-lg transition-colors"
                          >
                            Donate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="space-y-5">

            {/* Impact Stats */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-base mb-4 text-slate-900 dark:text-white">Impact Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <FileText className="w-4 h-4" /> Campaigns
                  </div>
                  <span className="font-black text-xl text-primary">{campaigns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <IndianRupee className="w-4 h-4" /> Total Raised
                  </div>
                  <span className="font-black text-xl text-emerald-500">₹{fmt(totalRaised)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" /> Total Donors
                  </div>
                  <span className="font-black text-xl text-purple-500">{fmt(ngo.totalDonors)}</span>
                </div>
                {joinedYear && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" /> Member Since
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{joinedYear}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-base mb-4 text-slate-900 dark:text-white">Contact</h3>
              <div className="space-y-3">
                {ngo.email && (
                  <a href={`mailto:${ngo.email}`} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{ngo.email}</span>
                  </a>
                )}
                {ngo.phone && (
                  <a href={`tel:${ngo.phone}`} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    {ngo.phone}
                  </a>
                )}
                {ngo.website && (
                  <a href={ngo.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{ngo.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
                {ngo.city && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    {[ngo.address, ngo.city, ngo.state, ngo.pincode].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Volunteer CTA */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-5 text-white">
              <Heart className="w-7 h-7 mb-2 opacity-80" />
              <h3 className="font-bold text-base mb-1">Want to Volunteer?</h3>
              <p className="text-xs text-white/70 mb-3 leading-relaxed">
                Join {ngo.name} and make a direct impact in your community.
              </p>
              <button
                onClick={() => navigate(`/messages?to=${ngo.firebaseUid}&subject=Volunteer Inquiry`)}
                className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                Get in Touch <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NgoProfilePage;
