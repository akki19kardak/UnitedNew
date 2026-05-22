import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../contexts/useAuth";
import axios from "axios";
import {
  Trophy, Star, Heart, Users, Zap, Shield,
  Award, Target, Flame, Clock, CheckCircle2,
  Loader2, Lock, TrendingUp, ArrowLeft, Megaphone
} from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

// ─── XP & Level System ─────────────────────────────────────────
// Level = floor(sqrt(xp / 50)) + 1
// XP = floor(totalDonated / 10) + (donationCount * 5) + (campaignsSupported * 20)
const calcLevel = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;
const xpForLevel = (lvl) => Math.pow(lvl - 1, 2) * 50;
const xpForNextLevel = (lvl) => Math.pow(lvl, 2) * 50;

// ─── Badge Definitions ─────────────────────────────────────────
// Each badge has: id, title, desc, icon, color, bgColor,
//   check(stats) → boolean, progress(stats) → { current, max }
const BADGES = [
  // ── Donation Milestones ──
  {
    id: "first_drop",
    category: "Giving",
    title: "First Drop",
    desc: "Make your very first donation",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-200 dark:border-rose-700",
    check: (s) => s.donationCount >= 1,
    progress: (s) => ({ current: Math.min(s.donationCount, 1), max: 1 }),
  },
  {
    id: "generous_five",
    category: "Giving",
    title: "Generous Five",
    desc: "Complete 5 donations",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-200 dark:border-rose-700",
    check: (s) => s.donationCount >= 5,
    progress: (s) => ({ current: Math.min(s.donationCount, 5), max: 5 }),
  },
  {
    id: "giving_dozen",
    category: "Giving",
    title: "Giving Dozen",
    desc: "Complete 12 donations",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-200 dark:border-rose-700",
    check: (s) => s.donationCount >= 12,
    progress: (s) => ({ current: Math.min(s.donationCount, 12), max: 12 }),
  },

  // ── Amount Milestones ──
  {
    id: "seed_funder",
    category: "Impact",
    title: "Seed Funder",
    desc: "Donate a total of ₹500",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200 dark:border-emerald-700",
    check: (s) => s.totalDonated >= 500,
    progress: (s) => ({ current: Math.min(s.totalDonated, 500), max: 500 }),
  },
  {
    id: "change_maker",
    category: "Impact",
    title: "Change Maker",
    desc: "Donate a total of ₹2,500",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200 dark:border-emerald-700",
    check: (s) => s.totalDonated >= 2500,
    progress: (s) => ({ current: Math.min(s.totalDonated, 2500), max: 2500 }),
  },
  {
    id: "impact_leader",
    category: "Impact",
    title: "Impact Leader",
    desc: "Donate a total of ₹10,000",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-700",
    check: (s) => s.totalDonated >= 10000,
    progress: (s) => ({ current: Math.min(s.totalDonated, 10000), max: 10000 }),
  },
  {
    id: "platinum_patron",
    category: "Impact",
    title: "Platinum Patron",
    desc: "Donate a total of ₹50,000",
    icon: Trophy,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-700",
    check: (s) => s.totalDonated >= 50000,
    progress: (s) => ({ current: Math.min(s.totalDonated, 50000), max: 50000 }),
  },

  // ── Campaign Diversity ──
  {
    id: "explorer",
    category: "Explorer",
    title: "Explorer",
    desc: "Support 3 different campaigns",
    icon: Megaphone,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700",
    check: (s) => s.campaignsSupported >= 3,
    progress: (s) => ({ current: Math.min(s.campaignsSupported, 3), max: 3 }),
  },
  {
    id: "champion",
    category: "Explorer",
    title: "Champion",
    desc: "Support 10 different campaigns",
    icon: Megaphone,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700",
    check: (s) => s.campaignsSupported >= 10,
    progress: (s) => ({ current: Math.min(s.campaignsSupported, 10), max: 10 }),
  },
  {
    id: "multi_cause",
    category: "Explorer",
    title: "Multi-Cause Hero",
    desc: "Donate to 3 different cause categories",
    icon: Zap,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-700",
    check: (s) => s.categoriesSupported >= 3,
    progress: (s) => ({ current: Math.min(s.categoriesSupported, 3), max: 3 }),
  },

  // ── Streaks / Loyalty ──
  {
    id: "consistent",
    category: "Loyalty",
    title: "Consistent Giver",
    desc: "Donate in 3 consecutive months",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-700",
    check: (s) => s.consecutiveMonths >= 3,
    progress: (s) => ({ current: Math.min(s.consecutiveMonths, 3), max: 3 }),
  },
  {
    id: "yearly_legend",
    category: "Loyalty",
    title: "Yearly Legend",
    desc: "Donate in 12 consecutive months",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-700",
    check: (s) => s.consecutiveMonths >= 12,
    progress: (s) => ({ current: Math.min(s.consecutiveMonths, 12), max: 12 }),
  },

  // ── Profile ──
  {
    id: "profile_complete",
    category: "Profile",
    title: "Complete Profile",
    desc: "Fill in your bio and phone number",
    icon: Shield,
    color: "text-slate-500",
    bgColor: "bg-slate-50 dark:bg-slate-800",
    borderColor: "border-slate-200 dark:border-slate-700",
    check: (s) => s.profileComplete,
    progress: (s) => ({ current: s.profileComplete ? 1 : 0, max: 1 }),
  },
  {
    id: "early_adopter",
    category: "Profile",
    title: "Early Adopter",
    desc: "Joined United Impact in its first year",
    icon: Award,
    color: "text-primary",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700",
    check: (s) => s.isEarlyAdopter,
    progress: (s) => ({ current: s.isEarlyAdopter ? 1 : 0, max: 1 }),
  },
];

const CATEGORIES = ["All", "Giving", "Impact", "Explorer", "Loyalty", "Profile"];

// ─── Level color theme ──────────────────────────────────────────
const levelTheme = (level) => {
  if (level >= 20) return { label: "Legendary", color: "text-purple-500", bg: "from-purple-500 to-pink-500" };
  if (level >= 15) return { label: "Diamond", color: "text-sky-400", bg: "from-sky-400 to-blue-600" };
  if (level >= 10) return { label: "Gold", color: "text-amber-400", bg: "from-amber-400 to-yellow-500" };
  if (level >= 5) return { label: "Silver", color: "text-slate-400", bg: "from-slate-400 to-slate-500" };
  return { label: "Bronze", color: "text-orange-400", bg: "from-orange-400 to-amber-500" };
};

// ─── Badge Card ─────────────────────────────────────────────────
const BadgeCard = ({ badge, unlocked, stats }) => {
  const Icon = badge.icon;
  const prog = badge.progress(stats);
  const pct = Math.round((prog.current / prog.max) * 100);

  return (
    <div className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all duration-200
      ${unlocked
        ? `${badge.bgColor} ${badge.borderColor} shadow-sm hover:shadow-md hover:-translate-y-0.5`
        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 grayscale"
      }`}
    >
      {/* Unlocked glow */}
      {unlocked && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}

      {!unlocked && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-400 dark:bg-slate-600 rounded-full flex items-center justify-center">
          <Lock className="w-3 h-3 text-white" />
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3
        ${unlocked ? badge.bgColor : "bg-slate-100 dark:bg-slate-800"}`}
      >
        <Icon className={`w-6 h-6 ${unlocked ? badge.color : "text-slate-400"}`} />
      </div>

      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
        {badge.category}
      </span>
      <h3 className={`font-bold text-sm mb-1 ${unlocked ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
        {badge.title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-3">
        {badge.desc}
      </p>

      {/* Progress bar */}
      <div className="mt-auto">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
          <span>{prog.current} / {prog.max}</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${unlocked ? "bg-emerald-500" : "bg-slate-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Stat Pill ──────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────
const AchievementsPage = () => {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [showUnlocked, setShowUnlocked] = useState(false); // false = show all

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch donations
        const donRes = await axios.get(`${API}/donations/my`, config);
        const donations = Array.isArray(donRes.data)
          ? donRes.data
          : donRes.data.donations || [];

        const completed = donations.filter(
          (d) => d.status === "completed" || !d.status
        );

        const totalDonated = completed.reduce((s, d) => s + (d.amount || 0), 0);
        const donationCount = completed.length;
        const campaignIds = [...new Set(completed.map((d) => d.campaignId?._id || d.campaignId))];
        const campaignsSupported = campaignIds.length;

        // Unique categories supported
        const categoriesSupported = new Set(
          completed
            .map((d) => d.campaignId?.category)
            .filter(Boolean)
        ).size;

        // Consecutive months streak
        const monthSet = new Set(
          completed.map((d) => {
            const dt = new Date(d.createdAt);
            return `${dt.getFullYear()}-${dt.getMonth()}`;
          })
        );
        let consecutiveMonths = 0;
        const now = new Date();
        for (let i = 0; i < 24; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthSet.has(key)) {
            consecutiveMonths++;
          } else if (i > 0) {
            break;
          }
        }

        // XP calculation
        const xp = Math.floor(totalDonated / 10)
          + donationCount * 5
          + campaignsSupported * 20;
        const level = calcLevel(xp);

        // Profile completeness
        const profileComplete = !!(user.bio && user.phone);

        // Early adopter: joined before Jan 2026
        const isEarlyAdopter = user.createdAt
          ? new Date(user.createdAt) < new Date("2026-01-01")
          : false;

        setStats({
          totalDonated,
          donationCount,
          campaignsSupported,
          categoriesSupported,
          consecutiveMonths,
          xp,
          level,
          profileComplete,
          isEarlyAdopter,
        });
      } catch (err) {
        console.error("Achievements load error:", err);
        // Set zeroed stats so page still renders
        setStats({
          totalDonated: 0, donationCount: 0, campaignsSupported: 0,
          categoriesSupported: 0, consecutiveMonths: 0,
          xp: 0, level: 1, profileComplete: false, isEarlyAdopter: false,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate, getToken]);

  if (loading) return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );

  const theme = levelTheme(stats.level);
  const currXP = stats.xp - xpForLevel(stats.level);
  const needXP = xpForNextLevel(stats.level) - xpForLevel(stats.level);
  const levelPct = Math.min(Math.round((currXP / needXP) * 100), 100);

  const unlockedBadges = BADGES.filter((b) => b.check(stats));
  const filteredBadges = BADGES.filter(
    (b) =>
      (activeTab === "All" || b.category === activeTab) &&
      (!showUnlocked || b.check(stats))
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-display text-slate-800 dark:text-slate-200">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Achievements</h1>
              <p className="text-xs text-slate-500">Your impact journey</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${theme.color}`}>{theme.label}</span>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.bg} flex items-center justify-center text-white font-extrabold text-xs shadow-lg`}>
              {stats.level}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Level Card ── */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.bg} p-8 text-white shadow-xl`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-32 h-32 rounded-full border-8 border-white" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full border-8 border-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">
                  Current Rank
                </p>
                <h2 className="text-5xl font-extrabold">Level {stats.level}</h2>
                <p className="text-white/80 mt-1 font-semibold">{theme.label} Tier</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                  Total XP
                </p>
                <p className="text-3xl font-extrabold">{fmt(stats.xp)}</p>
                <p className="text-white/70 text-xs mt-1">
                  {fmt(needXP - currXP)} XP to Level {stats.level + 1}
                </p>
              </div>
            </div>

            {/* XP Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-white/70 font-semibold mb-2">
                <span>Level {stats.level}</span>
                <span>{levelPct}%</span>
                <span>Level {stats.level + 1}</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${levelPct}%` }}
                />
              </div>
            </div>

            <p className="text-white/60 text-xs mt-2">
              XP earned from: ₹10 donated = 1 XP · each donation = +5 XP · each campaign = +20 XP
            </p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatPill
            icon={Heart}
            label="Total Donated"
            value={`₹${fmt(stats.totalDonated)}`}
            color="bg-rose-50 dark:bg-rose-900/20 text-rose-500"
          />
          <StatPill
            icon={CheckCircle2}
            label="Donations Made"
            value={stats.donationCount}
            color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"
          />
          <StatPill
            icon={Megaphone}
            label="Campaigns Supported"
            value={stats.campaignsSupported}
            color="bg-blue-50 dark:bg-blue-900/20 text-primary"
          />
          <StatPill
            icon={Flame}
            label="Month Streak"
            value={`${stats.consecutiveMonths} 🔥`}
            color="bg-orange-50 dark:bg-orange-900/20 text-orange-500"
          />
        </div>

        {/* ── Badges Section ── */}
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Badges
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {unlockedBadges.length} of {BADGES.length} unlocked
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUnlocked((p) => !p)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all
                  ${showUnlocked
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
              >
                {showUnlocked ? "Show All" : "Unlocked Only"}
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${activeTab === cat
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Badge grid */}
          {filteredBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Trophy className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">No badges in this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={badge.check(stats)}
                  stats={stats}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Progress to next badge ── */}
        {(() => {
          const nextBadge = BADGES.find((b) => !b.check(stats) && b.progress(stats).current > 0);
          if (!nextBadge) return null;
          const prog = nextBadge.progress(stats);
          const pct = Math.round((prog.current / prog.max) * 100);
          const Icon = nextBadge.icon;
          return (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-slate-900 dark:text-white">Closest Badge</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${nextBadge.bgColor}`}>
                  <Icon className={`w-7 h-7 ${nextBadge.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{nextBadge.title}</p>
                    <span className="text-xs font-bold text-slate-500">{prog.current}/{prog.max}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{nextBadge.desc}</p>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── CTA if no donations yet ── */}
        {stats.donationCount === 0 && (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Start Your Journey
            </h3>
            <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
              Make your first donation to unlock badges, earn XP and start climbing the impact leaderboard.
            </p>
            <button
              onClick={() => navigate("/campaigns")}
              className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-blue-600 transition-colors"
            >
              Explore Campaigns
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default AchievementsPage;
