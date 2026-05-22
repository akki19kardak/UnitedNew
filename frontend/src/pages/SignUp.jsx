import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Users, Mail, Lock, Eye, EyeOff, Loader2, UserCheck } from "lucide-react";
import useAuth from "../contexts/useAuth";

const SignupPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, user, loading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectMap = {
    ngo: "/dashboard",
    volunteer: "/dashboard",
    donor: "/dashboard",
    admin: "/admin/verification",
  };

  // ✅ Redirect once AuthContext has set the user after signup
  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "admin" ? "/admin/verification" : "/dashboard");
    }
  }, [user, loading, navigate]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const nameParts = form.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // ✅ register() in AuthContext handles both Firebase + MongoDB user creation
      await register({
        email: form.email,
        password: form.password,
        firstName,
        lastName,
        role: form.role,
      });
      // Navigation is handled by the useEffect above once user state updates
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setSubmitting(true);
    try {
      // ✅ loginWithGoogle() uses popup — no return value needed, useEffect handles redirect
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign-up failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-white dark:bg-background-dark font-display antialiased">
      {/* Left Panel */}
      <section className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-primary via-emerald-400 to-primary relative overflow-hidden flex-col justify-center px-12 text-white">
        <div className="relative z-10 max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <Users className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">United Impact</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">Join United Impact</h1>
          <p className="text-lg text-white/90 leading-relaxed">
            Sign up as a donor, volunteer, or NGO and start making impact.
          </p>
        </div>
      </section>

      {/* Right Panel */}
      <section className="w-full lg:w-[60%] flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-white dark:bg-background-dark">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Create an Account
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Choose your role and enter your details.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Akshat Kardak"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
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

            {/* Role */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Choose Role
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                >
                  <option value="donor">Donor</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You can later change this from Admin/MongoDB if needed.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="border-b border-slate-200 dark:border-slate-800 w-1/5 lg:w-1/4"></span>
            <span className="text-xs text-center text-slate-500 uppercase font-bold tracking-widest">or</span>
            <span className="border-b border-slate-200 dark:border-slate-800 w-1/5 lg:w-1/4"></span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
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
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-primary hover:text-primary/80">
              Log In
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default SignupPage;
