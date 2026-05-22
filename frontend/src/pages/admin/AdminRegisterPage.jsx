import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import axios from "axios";
import { ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const AdminRegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminSecret: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.adminSecret) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const token = await userCredential.user.getIdToken();

      // 2. Register as admin in MongoDB
      await axios.post(
        `${API}/users/admin-register`,
        {
          uid: userCredential.user.uid,
          email: formData.email,
          name: formData.name,
          adminSecret: formData.adminSecret,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 3. Success - redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Admin registration error:", err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already registered");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Admin Registration
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create your administrator account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Admin User"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@unitedimpact.com"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
              />
            </div>

            {/* Admin Secret Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Admin Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  name="adminSecret"
                  value={formData.adminSecret}
                  onChange={handleChange}
                  placeholder="Enter secret key"
                  className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Contact system administrator for the secret key
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Admin Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Already have an account? <span className="font-semibold">Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
