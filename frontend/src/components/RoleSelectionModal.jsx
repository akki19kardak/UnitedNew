import { useState } from "react";
import axios from "axios";
import useAuth from "../contexts/useAuth";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export default function RoleSelectionModal() {
  const { user, firebaseUser, refreshUser } = useAuth();
  const [role, setRole] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Only show when user is authenticated but has no role yet
  if (!user?.needsRole) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return setError("Please select a role");
    if (role === "ngo" && !orgName.trim()) return setError("Organisation name is required for NGOs");

    setLoading(true);
    setError("");

    try {
      const token = await firebaseUser.getIdToken();
      await axios.post(
        `${API}/users/set-role`,
        { role, orgName, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshUser(); // ✅ Reloads user from MongoDB — modal auto-hides when needsRole = false
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Welcome to UnitedImpact!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            One last step — choose your role to get started.
            <br />
            <span className="text-xs text-red-400">This cannot be changed later.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Role Cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "donor", emoji: "🤝", label: "Donor", desc: "Donate to campaigns" },
              { value: "volunteer", emoji: "💪", label: "Volunteer", desc: "Offer your skills" },
              { value: "ngo", emoji: "🏢", label: "NGO", desc: "Run campaigns" },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setRole(r.value); setError(""); }}
                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  role === r.value
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                }`}
              >
                <div className="text-2xl mb-1">{r.emoji}</div>
                <div className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                  {r.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>

          {/* NGO extra field */}
          {role === "ngo" && (
            <input
              type="text"
              placeholder="Organisation Name *"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full border border-slate-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
            />
          )}

          {/* Phone */}
          <input
            type="tel"
            placeholder="Phone Number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
          />

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !role}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : (
              "Continue →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
