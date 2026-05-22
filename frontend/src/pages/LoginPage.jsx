import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import useAuth from "../contexts/useAuth";
import RoleSelectionModal from "../components/RoleSelectionModal";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, user, loading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ✅ Redirect once user is authenticated and has a role
  // If needsRole=true, RoleSelectionModal shows first, then this fires after refreshUser()
  useEffect(() => {
    if (!loading && user && !user.needsRole) {
      if (user.role === "admin") {
        navigate("/admin/verification");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password });
      // ✅ useEffect handles redirect after user state updates
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
      // ✅ If new Google user → needsRole=true → RoleSelectionModal shows
      // ✅ If existing Google user → needsRole=false → useEffect redirects to dashboard
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-white dark:bg-background-dark font-display antialiased">

      {/* ✅ Role modal for new Google users who land back on login page */}
      <RoleSelectionModal />

      {/* Left Panel */}
      <section className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-primary via-emerald-400 to-primary relative overflow-hidden flex-col justify-center px-12 text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <Users className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">United Impact</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">Welcome Back!</h1>
          <p className="text-lg text-white/90 leading-relaxed mb-10">
            Continue your journey of making a difference. Connect with NGOs,
            track your donations, and see the impact you're creating in the community.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Active NGOs", value: "2,400+" },
              { label: "Volunteers Joined", value: "12,000+" },
              { label: "Campaigns Funded", value: "₹48 Cr+" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="font-bold">{s.value}</span>
                <span className="text-white/70 text-sm">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["JD", "AK", "SM"].map((l) => (
                <div
                  key={l}
                  className="w-8 h-8 rounded-full bg-primary/40 border-2 border-white flex items-center justify-center text-[10px] font-bold"
                >
                  {l}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-white/80">+12k Active Volunteers</span>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="w-full lg:w-[60%] flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-white dark:bg-background-dark">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Login to Your Account
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="email" name="email" type="email" required
                  placeholder="name@company.com"
                  value={form.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"} required
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
                : "Log In"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="border-b border-slate-200 dark:border-slate-800 w-1/5 lg:w-1/4"></span>
            <span className="text-xs text-center text-slate-500 uppercase font-bold tracking-widest">or</span>
            <span className="border-b border-slate-200 dark:border-slate-800 w-1/5 lg:w-1/4"></span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="mt-6 w-full flex items-center justify-center gap-3 py-3.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold text-slate-700 dark:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-10 text-center text-slate-600 dark:text-slate-400">
            Don't have an account?{" "}
            <Link to="/signup" className="font-bold text-primary hover:text-primary/80">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-auto pt-8 flex gap-6 text-xs text-slate-400">
          <span>© 2026 United Impact</span>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
