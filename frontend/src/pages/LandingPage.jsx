import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart, Users, Shield, Globe, ArrowRight,
  Star, TrendingUp, CheckCircle
} from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const LandingPage = () => {
  const [liveStats, setLiveStats] = useState({
    donations: 0,
    ngos: 0,
    volunteers: 0,
    campaigns: 0,
  });

  // Clean useEffect fetching from MongoDB backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${API}/stats/landing`);
        setLiveStats({
          donations: data.totalDonations || 0,
          ngos: data.totalNgos || 0,
          volunteers: data.totalVolunteers || 0,
          campaigns: data.activeCampaigns || 0,
        });
      } catch (err) {
        console.error("Failed to load landing stats", err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: "Donations Processed", value: `₹${liveStats.donations.toLocaleString()}`, icon: Heart, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    { label: "Verified NGOs", value: liveStats.ngos.toLocaleString(), icon: Shield, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Volunteers", value: liveStats.volunteers.toLocaleString(), icon: Users, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Active Campaigns", value: liveStats.campaigns.toLocaleString(), icon: Globe, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  const features = [
    {
      icon: Shield,
      title: "NGO Listings",
      desc: "Discover and connect with verified non-profits working across various social sectors globally.",
      color: "bg-blue-500",
    },
    {
      icon: Star,
      title: "Skill-based Discovery",
      desc: "Our smart matching engine pairs volunteers with projects that perfectly fit their professional expertise.",
      color: "bg-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Secure Donation Tracking",
      desc: "Full transparency on how your money is used with detailed impact reports and secure processing.",
      color: "bg-emerald-500",
    },
    {
      icon: Users,
      title: "Volunteer Coordination",
      desc: "Seamlessly manage teams, shifts, and communication all within a single unified platform.",
      color: "bg-amber-500",
    },
    {
      icon: Globe,
      title: "Impact Reports",
      desc: "Automated PDF reports and real-time dashboards so stakeholders always know the impact made.",
      color: "bg-pink-500",
    },
    {
      icon: CheckCircle,
      title: "80G Tax Benefits",
      desc: "All donations are eligible for 80G tax deduction with instant receipt generation.",
      color: "bg-cyan-500",
    },
  ];

  const testimonials = [
    { name: "Priya Sharma", role: "NGO Director", content: "This platform transformed how we manage campaigns and connect with donors. Highly recommended!", avatar: "PS" },
    { name: "Rajesh Kumar", role: "Volunteer", content: "Found amazing opportunities to make a real difference in my community within the first week.", avatar: "RK" },
    { name: "Anita Singh", role: "Donor", content: "The transparency and impact tracking give me confidence in every single donation I make.", avatar: "AS" },
  ];

  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-display">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">

        {/* Blobs — subtle in light, vivid in dark */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/5 dark:bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
              New: AI-Powered Skill Matching
            </span>

            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight mb-6">
              United Impact:{" "}
              <span className="text-primary">Connecting Change-Makers</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10 max-w-lg">
              Bridging the gap between non-profits, dedicated volunteers, and generous donors.
              Together, we amplify impact and build a better future for everyone.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="flex items-center gap-2 px-7 py-3.5 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.97]"
              >
                Get Started Now <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 px-7 py-3.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white font-bold rounded-xl transition-all"
              >
                Learn More
              </a>
            </div>

            {/* Trust row */}
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {["PS", "RK", "AS", "MN"].map((a) => (
                  <div key={a} className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/30 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-primary">
                    {a}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-white">{(liveStats.ngos + liveStats.volunteers).toLocaleString("en-IN")}+</span> changemakers joined
              </p>
            </div>
          </div>

          {/* Right — image */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 border border-slate-200 dark:border-white/10">
              <img
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=700&auto=format&fit=crop"
                alt="Team collaborating"
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-5 -left-5 bg-white dark:bg-slate-900 rounded-xl shadow-xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{liveStats.ngos} NGOs Verified</p>
                <p className="text-[10px] text-slate-400">Trusted & Transparent</p>
              </div>
            </div>

            {/* Second floating badge */}
            <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 rounded-xl shadow-xl p-3 flex items-center gap-2 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">₹{liveStats.donations.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Donations Processed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
          <div className="w-5 h-8 border-2 border-slate-400 dark:border-slate-600 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="text-center">
              <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Our Features</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Everything you need to drive change
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
              Our platform provides the infrastructure so you can focus on making a difference.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">How It Works</span>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-14">
            Simple steps, massive impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-primary/20" />
            {[
              { step: "01", title: "Create an Account", desc: "Register as an NGO, Donor, or Volunteer in under 2 minutes." },
              { step: "02", title: "Discover & Connect", desc: "Find campaigns, causes, or volunteer opportunities that match your passion." },
              { step: "03", title: "Make an Impact", desc: "Donate securely, volunteer your time, and track your real-world impact." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border-2 border-primary/20">
                  <span className="text-primary font-black text-lg">{step}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="impact" className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Testimonials</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">
              Trusted by thousands across India
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, content, avatar }) => (
              <div
                key={name}
                className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{name}</p>
                    <p className="text-xs text-slate-400">{role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Ready to make a difference?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join over 1 lakh changemakers already creating impact on United Impact.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all active:scale-[0.97] shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/campaigns"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl transition-all"
            >
              Browse Campaigns
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
